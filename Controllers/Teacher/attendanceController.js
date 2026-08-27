//Models
const Children = require("../../Models/Children");
const Attendance = require("../../Models/TeacherAttendance");
const fs = require("fs");
const crypto = require("crypto");
const moment = require("moment");
//Helpers 
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const {
  sendNotificationToAdmin,
  sendNotificationToUser,
} = require("../../Helpers/notification");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");
const mongoose = require("mongoose");
const Teacher = require("../../Models/Teacher");

exports.markCheckIn = async (req, res) => {
    let { checkIn } = req.body; // checkIn is sent in UTC-0
    let teacher = await Teacher.findById(req.user._id);

    if (!teacher) {
        return res.json(ApiResponse({}, "Teacher Not Found", false));
    }

    try {
        const attendanceDate = moment.utc(checkIn).startOf('day'); // Ensure it's treated as UTC-0
        const today = moment.utc().startOf('day'); // Get today’s date in UTC

        // Ensure check-in date is today in UTC
        if (!attendanceDate.isSame(today, 'day')) {
            return res.status(400).json(ApiResponse({}, "Attendance Date should be today", false));
        }

        // Define correct start and end of the day in UTC
        const startDate = moment.utc(checkIn).startOf('day');
        const endDate = moment.utc(checkIn).endOf('day');

        // Check if attendance is already marked for today
        let existingAttendance = await Attendance.findOne({
            teacher,
            checkIn: {
                $gte: startDate.toDate(),
                $lte: endDate.toDate()
            }
        });

        if (existingAttendance) {
            return res.status(400).json(ApiResponse({}, "Check-In Already Marked", false));
        }

        // Create new attendance record
        const newAttendance = new Attendance({
            teacher,
            checkIn: moment.utc(checkIn).toDate(), // Ensure stored as UTC-0
            status: "PRESENT"
        });

        await newAttendance.save();

        // Update teacher check-in status
        teacher.checkIn = true;
        await teacher.save();

        return res.status(200).json(ApiResponse({ newAttendance }, "Check-In Marked Successfully", true));

    } catch (error) {
        return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
    }
};

exports.markCheckOut = async (req, res) => {
  let { checkOut } = req.body;
  let teacher = await Teacher.findById(req.user._id);

  if (!teacher) {
    return res.json(ApiResponse({}, "Teacher Not Found", false));
  }

  try {
    // Convert checkOut to UTC & define start/end of the day in UTC
    const checkOutUTC = moment.utc(checkOut);
    const startDate = checkOutUTC.clone().startOf('day').toDate();
    const endDate = checkOutUTC.clone().endOf('day').toDate();

    // Get today's date in UTC for comparison
    const todayUTC = moment.utc().startOf('day');

    // Ensure checkOut is for today
    if (!checkOutUTC.isSame(todayUTC, 'day')) {
      return res.status(400).json(ApiResponse({}, "CheckOut Date should be today", false));
    }

    // Find existing attendance for today
    let existingAttendance = await Attendance.findOne({
      teacher,
      checkIn: { $gte: startDate, $lte: endDate } // Check if a check-in exists for today
    });

    if (!existingAttendance) {
      return res.status(400).json(ApiResponse({}, "Check-In not found for today", false));
    }

    // If already checked out, prevent duplicate check-out
    if (existingAttendance.checkOut) {
      return res.status(400).json(ApiResponse({}, "CheckOut Already Marked", false));
    }

    // Update attendance record with check-out time
    existingAttendance.checkOut = checkOutUTC.toDate();
    await existingAttendance.save();

    // Update teacher's checkOut status
    teacher.checkOut = true;
    await teacher.save();

    return res.status(200).json(ApiResponse({ existingAttendance }, "CheckOut Marked Successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
  }
};

exports.markLeave = async (req, res) => {
  let { leaveFrom, leaveTo, leaveType, leaveReason } = req.body;
  let teacher = await Teacher.findById(req.user._id);

  try {
    // Convert leave dates to UTC
    const startDate = moment.utc(leaveFrom).startOf('day');
    const endDate = moment.utc(leaveTo).endOf('day'); 

    // Calculate the duration of leave in days
    const leaveDuration = endDate.diff(startDate, 'days') + 1;

    if (leaveDuration < 1) {
      return res.status(400).json(ApiResponse({}, "Invalid leave duration", false));
    }
    
    let todayAttendance = null;
    const today = moment.utc().startOf("day");
    
    // Loop through each day of leave and mark attendance
    for (let i = 0; i < leaveDuration; i++) {
      const currentDate = startDate.clone().add(i, 'days');

      let existingAttendance = await Attendance.findOne({
        teacher,
        checkIn: {
          $gte: currentDate.toDate(),
          $lte: currentDate.clone().endOf('day').toDate()
        }
      });

      let attendanceRecord;
      if (existingAttendance) {
        existingAttendance.leaveReason = leaveReason;
        existingAttendance.leaveType = leaveType;
        existingAttendance.status = "LEAVE";
        await existingAttendance.save();
        attendanceRecord = existingAttendance;
      } else {
        attendanceRecord = new Attendance({
          teacher,
          checkIn: currentDate.toDate(),
          leaveType,
          leaveReason,
          status: "LEAVE"
        });
        await attendanceRecord.save();
      }

      // Capture today's attendance
      if (currentDate.isSame(today, "day")) {
        todayAttendance = attendanceRecord;
      }
    }

    // Update teacher's check-in status if leave includes today
    if (todayAttendance) {
      teacher.checkIn = true;
      await teacher.save();
    }

    return res.status(200).json(ApiResponse({ todayAttendance }, "Leave Marked Successfully", true));

  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
  }
};

exports.getAllMyAttendance = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let {from,to} = req.query

    let finalAggregate = [
      {
        $match: {
          teacher: new mongoose.Types.ObjectId(String(req.user._id)),
        },
      },  
      {
        $sort: {
          checkIn: -1
        }
      }
      
    ];

    if (req.query) {
      if (req.query.keyword) {
        finalAggregate.push({
          $match: {
            $or: [
              {
                "teacher.firstName": {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },
              {
                "teacher.lastName": {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },
            ],
          },
        });
      }

      if (req.query.teacher) {
        finalAggregate.push({
          $match: {
            teacher: req.query.teacher,
          },
        });
      }


      if (from) {
        finalAggregate.push({
          $match: {
            checkIn: {
              $gte: moment(from).startOf("day").toDate(),
            },
          },
        });
      }

      if (to) {
        finalAggregate.push({
          $match: {
            checkIn: {
              $lte: moment(to).endOf("day").toDate(),
            },
          },
        });
      }

      if (req.query.status) {
        finalAggregate.push({
          $match: {
            status: req.query.status,
          },
        });
      }
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Attendance.aggregate(finalAggregate)
        : Attendance.aggregate([]);

    Attendance.aggregatePaginate(myAggregate, { page, limit }).then(
      (attendance) => {
        res.json(ApiResponse(attendance));
      }
    ).catch((error) => {
      res.json(ApiResponse({}, error.message, false));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAttendanceByMonth = async (req, res) => {
  try {
    let { month, year } = req.query;

    // Default to current month & year if not provided
    const currentDate = moment.utc();

    if (!month) {
      month = currentDate.month() + 1; // Moment.js months are zero-based
    } else {
      month = parseInt(month); // Ensure month is an integer
    }

    if (!year) {
      year = currentDate.year();
    } else {
      year = parseInt(year); // Ensure year is an integer
    }

    // Ensure month is two digits
    const formattedMonth = month < 10 ? `0${month}` : `${month}`;

    // Construct start & end of the month in UTC
    const startOfMonth = moment.utc(`${year}-${formattedMonth}-01`).startOf("month").toDate();
    const endOfMonth = moment.utc(`${year}-${formattedMonth}-01`).endOf("month").toDate();

    // Aggregate attendance statistics
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          teacher: new mongoose.Types.ObjectId(String(req.user._id)),
          checkIn: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize stats object with default values
    let stats = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HOLIDAY: 0 };

    // Map query results into stats object
    attendanceStats.forEach(stat => {
      stats[stat._id] = stat.count;
    });

    // Count holidays separately
    stats.HOLIDAY = await Attendance.countDocuments({
      teacher: req.user._id,
      checkIn: { $gte: startOfMonth, $lte: endOfMonth },
      status: "HOLIDAY"
    });

    // Fetch attendance records for the given month
    const attendance = await Attendance.find({
      teacher: req.user._id,
      checkIn: { $gte: startOfMonth, $lte: endOfMonth }
    });

    return res.status(200).json(ApiResponse({ attendance, stats }, "Attendance fetched successfully", true));

  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getMonthlyAttendanceStats = async (req, res) => {
  try {
    let { month, year } = req.query;

    const currentDate = moment();

    if (!month) {
      month = (currentDate.month() + 1).toString(); // Moment.js months are zero-based
    }
    if (!year) {
      year = currentDate.year().toString();
    }

    // Ensure month is two digits
    month = month.length === 1 ? `0${month}` : month;

    // Construct date strings in ISO format (YYYY-MM-DD)
    const startOfMonth = moment.utc(`${year}-${month}-01`).startOf("month").toDate();
    const endOfMonth = moment.utc(`${year}-${month}-01`).endOf("month").toDate();

   // Aggregate to count status types
   const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        teacher: new mongoose.Types.ObjectId(String(req.user._id)),
        checkIn: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  // Convert the results to a more readable format
  let stats = {
    PRESENT: 0,
    ABSENT: 0,
    LEAVE: 0,
    HOLIDAY: 0 // Add holiday with default count 0
  };
  attendanceStats.forEach(stat => {
    stats[stat._id] = stat.count;
  });

  // If status is holiday, add it to the stats
  const holidayCount = await Attendance.countDocuments({
    teacher: req.user._id,
    checkIn: { $gte: startOfMonth, $lte: endOfMonth },
    status: "HOLIDAY"
  });

  stats["HOLIDAY"] = holidayCount;


  res.json(ApiResponse({stats}));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.json(ApiResponse({}, "Attendance not found", true));
    }

    return res.json(ApiResponse({ attendance }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// exports.markLeave = async (req, res) => {
//   let { leaveFrom, leaveTo, leaveType, leaveReason } = req.body;
//   let teacher = await Teacher.findById(req.user._id);

//   try {
//     const startDate = moment(leaveFrom).startOf('day').subtract(1,'day');
//     const endDate = moment(leaveTo).endOf('day'); 

//     // Calculate the duration of leave in days
//     const leaveDuration = endDate.diff(startDate, 'days');

//     // If leave duration is less than 1, return an error
//     if (leaveDuration < 1) {
//       return res.status(400).json(ApiResponse({}, "Invalid leave duration", false));
//     }
    
//     let todayAttendance = null;
//     const today = moment().startOf("day");
    
//     // Loop through each day of leave and mark attendance
//     for (let i = 0; i < leaveDuration; i++) {
//       const currentDate = startDate.clone().add(i, 'days');
    
//       let existingAttendance = await Attendance.findOne({
//         teacher,
//         checkIn: {
//           $gte: currentDate.startOf('day').toDate(),
//           $lte: currentDate.endOf('day').toDate()
//         }
//       });
      
//       let attendanceRecord;
//       if (existingAttendance) {
//         existingAttendance.leaveReason = leaveReason;
//         existingAttendance.leaveType = leaveType;
//         existingAttendance.status = "LEAVE";
//         await existingAttendance.save();
//         attendanceRecord = existingAttendance;
//       } else {
//         const newAttendance = new Attendance({
//           teacher,
//           checkIn: currentDate.toDate(),
//           leaveType,
//           leaveReason,
//           status: "LEAVE"
//         });
//         await newAttendance.save();
//         attendanceRecord = newAttendance;
//       }
    
//       // Capture today's attendance
//       if (currentDate.isSame(today, "day")) {
//         todayAttendance = attendanceRecord;
//       }
      
//       // Update teacher's check-in status for current day
//       if (currentDate.isSame(moment(), 'day')) {
//         teacher.checkIn = true;
//         await teacher.save();
//       }
//     }

//     // Fetch updated monthly attendance stats
//     // let { month, year } = req.query;
//     // const currentDate = moment();

//     // if (!month) {
//     //   month = (currentDate.month() + 1).toString(); // Moment.js months are zero-based
//     // }
//     // if (!year) {
//     //   year = currentDate.year().toString();
//     // }

//     // Ensure month is two digits
//     // month = month.length === 1 ? `0${month}` : month;

//     // Construct date strings in ISO format (YYYY-MM-DD)
//     // const startOfMonth = moment(`${year}-${month}-01`).startOf("month").toDate();
//     // const endOfMonth = moment(`${year}-${month}-01`).endOf("month").toDate();

//     // const attendanceStats = await Attendance.aggregate([
//     //   {
//     //     $match: {
//     //       teacher: req.user._id,
//     //       checkIn: { $gte: startOfMonth, $lte: endOfMonth }
//     //     }
//     //   },
//     //   {
//     //     $group: {
//     //       _id: "$status",
//     //       count: { $sum: 1 }
//     //     }
//     //   }
//     // ]);

//     // let stats = {
//     //   PRESENT: 0,
//     //   ABSENT: 0,
//     //   LEAVE: 0,
//     //   HOLIDAY: 0
//     // };

//     // attendanceStats.forEach(stat => {
//     //   stats[stat._id] = stat.count;
//     // });

//     // const holidayCount = await Attendance.countDocuments({
//     //   teacher: req.user._id,
//     //   checkIn: { $gte: startOfMonth, $lte: endOfMonth },
//     //   status: "HOLIDAY"
//     // });

//     // stats["HOLIDAY"] = holidayCount;

//     return res.status(200).json(ApiResponse({ todayAttendance }, "Leave Marked Successfully", true));

//   } catch (error) {
//     return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
//   }
// };

// exports.getAttendanceByMonth = async (req, res) => {
//   try {
//     let { month, year } = req.query;

//     const currentDate = moment();

//     if (!month) {
//       month = (currentDate.month() + 1).toString(); // Moment.js months are zero-based
//     }
//     if (!year) {
//       year = currentDate.year().toString();
//     }

//     // Ensure month is two digits
//     month = month.length === 1 ? `0${month}` : month;

//     // Construct date strings in ISO format (YYYY-MM-DD)
//     const startOfMonth = moment.utc(`${year}-${month}-01`).startOf("month").toDate();
//     const endOfMonth = moment.utc(`${year}-${month}-01`).endOf("month").toDate();
//   // Aggregate to count status types
//   const attendanceStats = await Attendance.aggregate([
//     {
//       $match: {
//         teacher: req.user._id,
//         checkIn: { $gte: startOfMonth, $lte: endOfMonth }
//       }
//     },
//     {
//       $group: {
//         _id: "$status",
//         count: { $sum: 1 }
//       }
//     }
//   ]);

//   // Convert the results to a more readable format
//   let stats = {
//     PRESENT: 0,
//     ABSENT: 0,
//     LEAVE: 0,
//     HOLIDAY: 0 // Add holiday with default count 0
//   };
//   attendanceStats.forEach(stat => {
//     stats[stat._id] = stat.count;
//   });

//   // If status is holiday, add it to the stats
//   const holidayCount = await Attendance.countDocuments({
//     teacher: req.user._id,
//     checkIn: { $gte: startOfMonth, $lte: endOfMonth },
//     status: "HOLIDAY"
//   });

//   stats["HOLIDAY"] = holidayCount;

//   const attendance = await Attendance.find({
//     teacher: req.user._id,
//     checkIn: { $gte: startOfMonth, $lte: endOfMonth },
//   });


//   res.json(ApiResponse({ attendance, stats }));
//   } catch (error) {
//     return res.json(ApiResponse({}, error.message, false));
//   }
// };
