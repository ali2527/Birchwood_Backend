//Models
const Children = require("../../Models/Children");
const Attendance = require("../../Models/Attendance");
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
const { childCheckinNotification, childLeaveNotification } = require("../../Helpers/sockets");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");
const mongoose = require("mongoose");
const Teacher = require("../../Models/Teacher");

exports.markCheckIn = async (req, res) => {
  try {
    let { checkIn, children, markedBy } = req.body;

    // Ensure checkIn is treated as UTC
    const startDate = moment.utc(checkIn).startOf("day");
    const endDate = moment.utc(checkIn).endOf("day");

    // Fetch the child with populated classroom
    let currentChild = await Children.findById(children).populate("classroom");

    if (!currentChild) {
      return res.status(404).json(ApiResponse({}, "Child Not Found", false));
    }

    let teacher = currentChild.classroom?.teacher;
    let parent = currentChild.parent;

    // Ensure check-in date is today's date in UTC
    const today = moment.utc().startOf("day");
    const attendanceDate = moment.utc(checkIn).startOf("day");

    if (!attendanceDate.isSame(today, "day")) {
      return res.status(400).json(ApiResponse({}, "Attendance Date should be today", false));
    }

    // Check if attendance already exists for today
    let existingAttendance = await Attendance.findOne({
      children,
      checkIn: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    });

    if (existingAttendance) {
      return res.status(400).json(ApiResponse({}, "Check-in Already Marked", false));
    }

    // Create new attendance record
    const newAttendance = new Attendance({
      children,
      checkIn,
      markedBy,
      status: "PRESENT",
    });
    await newAttendance.save();

    // Update child's check-in status
    currentChild.checkIn = true;
    await currentChild.save();

    // Send notification
    childCheckinNotification(markedBy === "PARENT" ? teacher : parent, currentChild, newAttendance);

    return res.status(200).json(ApiResponse({newAttendance}, "Check-in Marked Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, errorHandler(error) || error.message, false));
  }
};

exports.markLeave = async (req, res) => {
  try {
    let { checkIn, leaveReason, children, markedBy } = req.body;

    // Ensure checkIn is treated as UTC
    const startDate = moment.utc(checkIn).startOf("day");
    const endDate = moment.utc(checkIn).endOf("day");

    // Fetch the child with populated classroom and parent
    let currentChild = await Children.findById(children).populate("classroom")

    if (!currentChild) {
      return res.status(404).json(ApiResponse({}, "Child not found", false));
    }

    let teacher = currentChild.classroom?.teacher;
    let parent = currentChild.parent;

    // Check if an attendance record exists for this date
    let existingAttendance = await Attendance.findOne({
      children,
      checkIn: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    });

    // Update child's check-in status only if marking leave for today
    const today = moment.utc().startOf("day");
    let todayAttendance = { checkIn };
    let attendanceRecord;

    if (existingAttendance) {
      // Update existing attendance record
      existingAttendance.leaveReason = leaveReason;
      existingAttendance.status = "LEAVE";
      await existingAttendance.save();
      attendanceRecord = existingAttendance;
    } else {
      // Create new attendance record
      attendanceRecord = new Attendance({
        children,
        checkIn,
        leaveReason,
        markedBy,
        status: "LEAVE",
      });
      await attendanceRecord.save();
    }

    if (moment.utc(checkIn).isSame(today, "day")) {
      todayAttendance = attendanceRecord;
      currentChild.checkIn = true;
      await currentChild.save();
    }

    // Send notification
    childLeaveNotification(markedBy === "PARENT" ? teacher : parent, currentChild, todayAttendance);

    return res.status(200).json(ApiResponse({todayAttendance}, "Leave Marked Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, errorHandler(error) || error.message, false));
  }
};

//get all Attendance
exports.getAllChildAttendance = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let {from,to} = req.query

    let currentChild = await Children.findById(req.params.child)

    if(!currentChild){
      return res.json(ApiResponse({}, "Child Not Found", false));
    }

    let finalAggregate = [
      {
        $match: {
          children: new mongoose.Types.ObjectId(req.params.child),
        },
      },
      {
        $sort: {
          checkInDate: 1
        }
      }
      
    ];

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

//get children Attendance By Month
exports.getAttendanceByMonth = async (req, res) => {  
  try {
    let { month, year } = req.query;

    const currentDate = moment.utc();
    month = month ? parseInt(month, 10) : currentDate.month() + 1; // Moment.js months are zero-based
    year = year ? parseInt(year, 10) : currentDate.year();

    // Ensure month is in two-digit format (e.g., 01, 02, ..., 12)
    const monthString = month.toString().padStart(2, '0');

    // Define start and end of the month in **UTC**
    const startOfMonth = moment.utc(`${year}-${monthString}-01`, "YYYY-MM-DD").startOf("month").toDate();
    const endOfMonth = moment.utc(`${year}-${monthString}-01`, "YYYY-MM-DD").endOf("month").toDate();

    const childId = new mongoose.Types.ObjectId(req.params.child);

    // Aggregate attendance statistics
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          children: childId,
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

    // Convert the results to a readable format
    let stats = { PRESENT: 0, ABSENT: 0, LEAVE: 0, HOLIDAY: 0 };
    attendanceStats.forEach(stat => {
      stats[stat._id] = stat.count || 0;
    });

    // Count holidays separately
    stats.HOLIDAY = await Attendance.countDocuments({
      children: childId,
      checkIn: { $gte: startOfMonth, $lte: endOfMonth },
      status: "HOLIDAY"
    });

    // Fetch attendance records for the child
    const attendance = await Attendance.find({
      children: childId,
      checkIn: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ checkInDate: -1 });

    res.json(ApiResponse({ attendance, stats }));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

//get children Attendance By Month
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
 
    // OLD CODE BY ALI
    // const startOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").startOf("month").startOf('day').toDate();
    // const endOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").endOf("month").endOf('day').toDate();
   
    const startOfMonth = moment.utc(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").startOf("month").toDate();
    const endOfMonth = moment.utc(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").endOf("month").toDate();
   
   const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        children: new mongoose.Types.ObjectId(req.params.child),
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
    children: new mongoose.Types.ObjectId(req.params.child),
    checkIn: { $gte: startOfMonth, $lte: endOfMonth },
    status: "HOLIDAY"
  });

  stats["HOLIDAY"] = holidayCount;


  res.json(ApiResponse({stats }));
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

// exports.markCheckIn = async (req, res) => {
//     let {checkIn,children,markedBy} = req.body;
//     const startDate = moment(checkIn).startOf('day');
//     const endDate = moment(checkIn).endOf('day'); 

//     let currentChild = await Children.findById(children).populate("classroom")
//     let teacher = currentChild?.classroom?.teacher;
//     let parent = currentChild?.parent;

//     console.log(">>>>>>>>>>>>.",teacher,parent)
    
//     if(!currentChild){
//       return res.json(ApiResponse({}, "Child Not Found", false));
//     }

//     try {

//       const today = moment().startOf('day');
//       const attendanceDate = moment(checkIn).startOf('day');
    
//       if (!attendanceDate.isSame(today, 'day')) {
//         return res.status(400).json(ApiResponse({}, "Attendance Date should be today", false));
//       }


//       let existingAttendance = await Attendance.findOne({
//         children,
//         checkIn: {
//             $gte: startDate.toDate(), 
//             $lte: endDate.toDate()
//         }
//     });

//       if (existingAttendance) {
//         return res.status(500).json(ApiResponse({}, "CheckIn Already Marked", false));
//       }


//       const newAttendance = new Attendance({
//         children,
//         checkIn,
//         markedBy,
//         status:"PRESENT", 
//     });
//     await newAttendance.save();

//     currentChild.checkIn = true;
//     await currentChild.save()

//     childCheckinNotification(markedBy === "PARENT" ? teacher : parent ,currentChild,newAttendance)

//       // let title = "Child Checked In"
//       // let content = ` ${currentChild.firstName + " " + currentChild.lastName} has been checked in.`

//       // if (markedBy === "PARENT") {
//       //   if (teacher) {
//       //     sendNotificationToUser(teacher, title, content,type="NOTIFICATION",key="childCheckIn",currentChild._id)
//       //   }
//       // } else if (markedBy === "TEACHER") {
//       //   if (parent) {
//       //     sendNotificationToUser(parent, title, content,type="NOTIFICATION",key="childCheckIn",currentChild._id)
//       //   }
//       // }


//       return res.status(200).json(ApiResponse({ newAttendance }, "CheckIn Marked Successfully", true));
//     } catch (error) {
//       return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
//     }
//   };

// exports.markLeave = async (req, res) => {
//   let {checkIn,leaveReason,children,markedBy} = req.body;
//   const startDate = moment(checkIn).startOf('day');
//   const endDate = moment(checkIn).endOf('day'); 

//   let currentChild = await Children.findById(children)
//   let teacher = currentChild?.classroom?.teacher;
//   let parent = currentChild?.parent;


//   try {


//     let existingAttendance = await Attendance.findOne({
//       children,
//       checkIn: {
//           $gte: startDate.toDate(), 
//           $lte: endDate.toDate()
//       }
//   });

//   const today = moment().startOf('day');
//   if (moment(checkIn).isSame(today, 'day')) {
//     currentChild.checkIn = true;
//     await currentChild.save();
//   }
  
//   if (existingAttendance) {
//     existingAttendance.leaveReason = leaveReason;
//     existingAttendance.status = "LEAVE";
//     await existingAttendance.save();

//     childLeaveNotification(markedBy === "PARENT" ? teacher : parent ,currentChild,existingAttendance)

//     return res.status(200).json(ApiResponse(existingAttendance, "Leave Marked Successfully", true));

//   } else {
//     const newAttendance = new Attendance({
//       children,
//       checkIn,
//       leaveReason,
//       markedBy,
//       status: "LEAVE"  
//     });
//     await newAttendance.save();
//     childLeaveNotification(markedBy === "PARENT" ? teacher : parent ,currentChild,newAttendance)


//     return res.status(200).json(ApiResponse(newAttendance, "Leave Marked Successfully", true));

//   }


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

// //   OLD CODE BY ALI
//     // const startOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").startOf("month").startOf('day').toDate();
//     // const endOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").endOf("month").endOf('day').toDate();

//     const startOfMonth = moment.utc(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").startOf("month").toDate();
//     const endOfMonth = moment.utc(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").endOf("month").toDate();
   
//   const attendanceStats = await Attendance.aggregate([
//     {
//       $match: {
//         children: new mongoose.Types.ObjectId(req.params.child),
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
//     children: new mongoose.Types.ObjectId(req.params.child),
//     checkIn: { $gte: startOfMonth, $lte: endOfMonth },
//     status: "HOLIDAY"
//   });

//   stats["HOLIDAY"] = holidayCount;

//   const attendance = await Attendance.find({
//     children: new mongoose.Types.ObjectId(req.params.child),
//     checkIn: { $gte: startOfMonth, $lte: endOfMonth },
//   }).sort({checkInDate:-1});


//   res.json(ApiResponse({ attendance, stats }));
//   } catch (error) {
//     return res.json(ApiResponse({}, error.message, false));
//   }
// };
