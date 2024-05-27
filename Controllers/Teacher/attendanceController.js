//Models
const Children = require("../../Models/Children");
const Attendance = require("../../Models/TeacherAttendance");
const fs = require("fs");
const crypto = require("crypto");
const KJUR = require("jsrsasign");
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

//mark Check In
exports.markCheckIn = async (req, res) => {
    let {checkIn} = req.body;
    let teacher = await Teacher.findById(req.user._id)
    const startDate = moment(checkIn).startOf('day');
    const endDate = moment(checkIn).endOf('day'); 

    if(!teacher){
      return res.json(ApiResponse({}, "Teacher Not Found", false));
    }

    try {

      const today = moment().startOf('day');
      const attendanceDate = moment(checkIn).startOf('day');
    
      if (!attendanceDate.isSame(today, 'day')) {
        return res.status(400).json(ApiResponse({}, "Attendance Date should be today", false));
      }

console.log(teacher)
      let existingAttendance = await Attendance.findOne({
        teacher,
        checkIn: {
            $gte: startDate.toDate(), 
            $lte: endDate.toDate()
        }
    });

    console.log(existingAttendance)

      if (existingAttendance) {
        return res.status(500).json(ApiResponse({}, "CheckIn Already Marked", false));
      }


      const newAttendance = new Attendance({
        teacher,
        checkIn,
        status:"PRESENT"  
    });
    await newAttendance.save();

    teacher.checkIn = true;
    await teacher.save()

      return res.status(200).json(ApiResponse({ newAttendance }, "CheckIn Marked Successfully", true));
    } catch (error) {
      return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
    }
  };


  //mark Check In
exports.markCheckOut = async (req, res) => {
  let {checkOut} = req.body;
  let teacher = await Teacher.findById(req.user._id)
  const startDate = moment(checkOut).startOf('day');
  const endDate = moment(checkOut).endOf('day'); 

  if(!teacher){
    return res.json(ApiResponse({}, "Teacher Not Found", false));
  }

  try {

    const today = moment().startOf('day');
    const attendanceDate = moment(checkOut).startOf('day');
  
    if (!attendanceDate.isSame(today, 'day')) {
      return res.status(400).json(ApiResponse({}, "Attendance Date should be today", false));
    }


    let existingAttendance = await Attendance.findOne({
      teacher,
      checkOut: {
          $gte: startDate.toDate(), 
          $lte: endDate.toDate()
      }
  });

  console.log(existingAttendance)

    if (existingAttendance) {
      return res.status(500).json(ApiResponse({}, "CheckOut Already Marked", false));
    }


    const newAttendance = new Attendance({
      teacher,
      checkOut,
    
  });
  await newAttendance.save();
  
  teacher.checkOut = true;
  await teacher.save()


    return res.status(200).json(ApiResponse({ newAttendance }, "checkOut Marked Successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
  }
};


exports.markLeave = async (req, res) => {
  let { leaveFrom, leaveTo, leaveType, leaveReason } = req.body;
  let teacher = await Teacher.findById(req.user._id);

  try {
    const startDate = moment(leaveFrom).startOf('day').subtract(1,'day');
    const endDate = moment(leaveTo).endOf('day'); 

    // Calculate the duration of leave in days
    const leaveDuration = endDate.diff(startDate, 'days') ; // Adding 1 to include both start and end dates

    // If leave duration is less than 1, return an error
    if (leaveDuration < 1) {
      return res.status(400).json(ApiResponse({}, "Invalid leave duration", false));
    }

    // Loop through each day of leave and mark attendance
    for (let i = 0; i < leaveDuration; i++) {
      const currentDate = startDate.clone().add(i, 'days');
    
      let existingAttendance = await Attendance.findOne({
        teacher,
        checkIn: {
          $gte: currentDate.startOf('day').toDate(),
          $lte: currentDate.endOf('day').toDate()
        }
      });
    

      if (existingAttendance) {
        existingAttendance.leaveReason = leaveReason;
        existingAttendance.leaveType = leaveType;
        existingAttendance.status = "LEAVE";
        await existingAttendance.save();
      } else {
        const newAttendance = new Attendance({
          teacher,
          checkIn: currentDate.toDate(),
          leaveType,
          leaveReason,
          status: "LEAVE"
        });
        await newAttendance.save();
      }

      // Update teacher's check-in status for current day
      if (currentDate.isSame(moment(), 'day')) {
        teacher.checkIn = true;
        await teacher.save();
      }
    }

    return res.status(200).json(ApiResponse({}, "Leave Marked Successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
  }
};

//get all Attendance
exports.getAllMyAttendance = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let {from,to} = req.query

    let finalAggregate = [
      {
        $match: {
          teacher: req.user._id,
        },
      },  
      {
        $sort: {
          checkInDate: -1
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
            checkInDate: {
              $gte: moment(from).startOf("day").toDate(),
            },
          },
        });
      }

      if (to) {
        finalAggregate.push({
          $match: {
            checkInDate: {
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
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//get teacher Attendance By Month
exports.getAttendanceByMonth = async (req, res) => {
  try {
    let { month, year } = req.query;

    const currentDate = moment();
    if (!month) {
      month = (currentDate.month() + 1).toString(); // Moment.js months are zero-based
    }
    if (!year) {
      year = currentDate.year().toString();
    }

    const startOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10) + 1}-01`).startOf("month").toDate();
    const endOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10) + 1}-01`).endOf("month").toDate();
   // Aggregate to count status types
   const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        teacher: req.user._id,
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

  const attendance = await Attendance.find({
    teacher: req.user._id,
    checkIn: { $gte: startOfMonth, $lte: endOfMonth },
  }).populate("teacher");


  res.json(ApiResponse({ attendance, stats }));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//get monthly Attendance stats
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

    const startOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10) + 1}-01`).startOf("month").toDate();
    const endOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10) + 1}-01`).endOf("month").toDate();
   // Aggregate to count status types
   const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        teacher: req.user._id,
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

// Get Attendance by ID
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

