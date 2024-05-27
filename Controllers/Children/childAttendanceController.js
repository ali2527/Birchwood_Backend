//Models
const Children = require("../../Models/Children");
const Attendance = require("../../Models/Attendance");
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
    let {checkIn,children} = req.body;
    const startDate = moment(checkIn).startOf('day');
    const endDate = moment(checkIn).endOf('day'); 

    let currentChild = await Children.findById(children)

    if(!currentChild){
      return res.json(ApiResponse({}, "Child Not Found", false));
    }

    try {

      const today = moment().startOf('day');
      const attendanceDate = moment(checkIn).startOf('day');
    
      if (!attendanceDate.isSame(today, 'day')) {
        return res.status(400).json(ApiResponse({}, "Attendance Date should be today", false));
      }


      let existingAttendance = await Attendance.findOne({
        children,
        checkIn: {
            $gte: startDate.toDate(), 
            $lte: endDate.toDate()
        }
    });

      if (existingAttendance) {
        return res.status(500).json(ApiResponse({}, "CheckIn Already Marked", false));
      }


      const newAttendance = new Attendance({
        children,
        checkIn,
        status:"PRESENT"  
    });
    await newAttendance.save();

    currentChild.checkIn = true;
    await currentChild.save()

      return res.status(200).json(ApiResponse({ newAttendance }, "CheckIn Marked Successfully", true));
    } catch (error) {
      return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
    }
  };

//markLeave
exports.markLeave = async (req, res) => {
  let {checkIn,leaveReason,children} = req.body;
  const startDate = moment(checkIn).startOf('day');
  const endDate = moment(checkIn).endOf('day'); 

  let currentChild = await Children.findById(children)
  try {


    let existingAttendance = await Attendance.findOne({
      children,
      checkIn: {
          $gte: startDate.toDate(), 
          $lte: endDate.toDate()
      }
  });

  if (existingAttendance) {
    existingAttendance.leaveReason = leaveReason;
    existingAttendance.status = "LEAVE";
    await existingAttendance.save();
  } else {
    const newAttendance = new Attendance({
      children,
      checkIn,
      leaveReason,
      status: "LEAVE"  
    });
    await newAttendance.save();
  }

  const today = moment().startOf('day');
  if (moment(checkIn).isSame(today, 'day')) {
    currentChild.checkIn = true;
    await currentChild.save();
  }

    return res.status(200).json(ApiResponse({ }, "Leave Marked Successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
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

    const currentDate = moment();
    if (!month) {
      month = (currentDate.month() + 1).toString(); // Moment.js months are zero-based
    }
    if (!year) {
      year = currentDate.year().toString();
    }

    const startOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").startOf("month").startOf('day').toDate();
const endOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").endOf("month").endOf('day').toDate();


   
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

  const attendance = await Attendance.find({
    children: new mongoose.Types.ObjectId(req.params.child),
    checkIn: { $gte: startOfMonth, $lte: endOfMonth },
  }).sort({checkInDate:-1});


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

    const startOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").startOf("month").startOf('day').toDate();
const endOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10)}-01`, "YYYY-MM-DD").endOf("month").endOf('day').toDate();
   
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
