//Models
const Teacher = require("../../Models/Teacher");
const Classroom = require("../../Models/Classroom");
const Attendance = require("../../Models/TeacherAttendance");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const {generateRandom6DigitID} = require("../../Helpers")
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const {sendNotificationToUser, sendNotificationToAdmin} = require("../../Helpers/notification")
const sanitizeUser = require("../../Helpers/sanitizeUser");
const moment = require("moment");
const { v4: uuidv4 } = require('uuid');
const mongoose = require("mongoose");

const fs = require("fs");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");


//signup
exports.addTeacher = async (req, res) => {
  // return;
  const {email,teacherId} = req.body;
  try {
    let teacher = await Teacher.findOne({
        $or: [
          { email },
          { teacherId }
        ]
      });
    if (teacher) {
      return res
        .status(400)
        .json(ApiResponse({}, "Teacher with this email / Teacher ID already exist", false));
    }

    teacher = new Teacher({
      ...req.body,
      education: JSON.parse(req.body.education || "[]") ,
      employment:JSON.parse(req.body.employment || "[]")
    });

    await teacher.save();

    const title ="New Teacher Added"
    const content = `A new teacher has been added on the app. Email : ${email}`
    sendNotificationToAdmin(title,content)   

    return res
      .status(200)
      .json(ApiResponse({ teacher }, "Teacher Added Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

//get all teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status } = req.query;

    let finalAggregate = [
      {
        $sort: {
          createdAt: 1,
        },
      },
       {
        $lookup: {
          from: "classrooms", // The name of the collection in the database
          localField: "classroom", // The field in the Teacher schema
          foreignField: "_id", // The matching field in the Classroom schema
          as: "classroom", // The new field in the output
        },
      },
      {
        $unwind: {
          path: "$classroom",
          preserveNullAndEmptyArrays: true, // Keep teachers with no classroom assigned
        },
      },
    ];

    if (keyword) {
      const regex = new RegExp(keyword.toLowerCase(), "i");
      finalAggregate.push({
        $match: {
          $or: [
            { firstName: { $regex: regex } },
            { lastName: { $regex: regex } },
            { email: { $regex: regex } },
            { teacherId: { $regex: regex } },
          ],
        },
      });
    }

    if (status) {
      finalAggregate.push({
        $match: {
          status: req.query.status,
        },
      });
    }

    if (from) {
      finalAggregate.push({
        $match: {
          createdAt: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          createdAt: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }
        if(req.query.classId){
      finalAggregate.push({
        $match: {
          "classroom._id": new mongoose.Types.ObjectId(req.query.classId),
        },
      });
    }


    const myAggregate =
      finalAggregate.length > 0
        ? Teacher.aggregate(finalAggregate)
        : Teacher.aggregate([]);

        Teacher.aggregatePaginate(myAggregate, { page, limit }).then(
      (teachers) => {
        res.json(ApiResponse(teachers));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};



//searchClassroom
exports.searchClassrooms = async (req, res) => {
  try {
    const { keyword } = req.query;

    //if not keyword return 10 students
    if (!keyword) {
      const classrooms = await Classroom.find({status:"ACTIVE"}).limit(10);
      return res.json(ApiResponse({ classrooms }, "", true));
    }

    const classrooms = await Classroom.find({
        $and: [
    { status: "ACTIVE" },
    {
      $or: [
       { classroomName: { $regex: keyword, $options: "i" } },
        { classroomId: { $regex: keyword, $options: "i" } },
      ],
    },
  ]
    });

    return res.json(ApiResponse({ classrooms }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
  }
};


// Get Teacher by ID
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('classroom');

    if (!teacher) {
      return res.json(ApiResponse({}, "Teacher not found", true));
    }

    return res.json(ApiResponse({ teacher }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


// Update Teacher
exports.updateTeacher = async (req, res) => {
  try {
    if (req.body.image) {
      let currentTeacher = await Teacher.findById(req.params.id);

      if (currentTeacher.image) {
        const filePath = `./Uploads/${currentTeacher.image}`;

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`File '${filePath}' deleted.`);
        } else {
          console.log(`File '${filePath}' does not exist.`);
        }
      }
    }
    
        if (req.body.teacherId) {
      const existingTeacher = await Teacher.findOne({
        teacherId: req.body.teacherId,
         _id: { $ne: req.params.id } // Exclude the current teacher
      });

      if (existingTeacher) {
        return res.json(ApiResponse({}, "TeacherID is already in use by another teacher", false));
      }
    }
    
    
       const data = (req.body.education || req.body.employment) ? {
      ...req.body,
      education:JSON.parse(req.body.education),
      employment:JSON.parse(req.body.employment)
    } : {...req.body};
    

    
 

    let teacher = await Teacher.findByIdAndUpdate(req.params.id,data, {
      new: true
    });

    if (!teacher) {
      return res.json(ApiResponse({}, "No teacher found", false));
    }

    return res.json(ApiResponse(teacher, "Teacher Profile updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//assign Class to Teacher
exports.assignClass = async (req, res) => {
  try {
    let teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.json(ApiResponse({}, "Teacher not found", false));
    }

    let classroom = await Classroom.findById(req.body.classroom);

    if (!classroom) {
      return res.json(ApiResponse({}, "Classroom not found", false));
    }
    teacher.classroom = req.body.classroom;
    classroom.teacher = teacher;

    await teacher.save();
    await classroom.save();

    return res.json(ApiResponse(teacher, "Class Assigned Successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete Teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndRemove(req.params.id);

    if (!teacher) {
      return res.json(ApiResponse({}, "Teacher not found", false));
    }

    if (teacher.image) {
      const filePath = `./Uploads/${teacher.image}`;

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File '${filePath}' deleted.`);
      } else {
        console.log(`File '${filePath}' does not exist.`);
      }
    }

    return res.json(ApiResponse({}, "Teacher Deleted Successfully", true));
  } catch (error) {
    return res.json(
      ApiResponse(
        {},
        errorHandler(error) ? errorHandler(error) : error.message,
        false
      )
    );
  }
};

// get Teacher Attendance By Month
exports.getTeacherAttendanceByMonth = async (req, res) => {
  try {
    let { month, year } = req.query;
    if(!month || !year){
      return res.json(ApiResponse({}, "Month and Year are Required", false));
    }

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
    const startOfMonth = moment(`${year}-${month}-01`).startOf("month").toDate();
    const endOfMonth = moment(`${year}-${month}-01`).endOf("month").toDate();
   // Aggregate to count status types
   const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        teacher: req.params.id,
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
    teacher: req.params.id,
    checkIn: { $gte: startOfMonth, $lte: endOfMonth },
    status: "HOLIDAY"
  });

  stats["HOLIDAY"] = holidayCount;

  const attendance = await Attendance.find({
    teacher: req.params.id,
    checkIn: { $gte: startOfMonth, $lte: endOfMonth },
  }).populate("teacher");


  res.json(ApiResponse({ attendance, stats }));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//reset Teacher password
exports.resetTeacherPassword = async (req, res) => {
  try {
    const { new_password } = req.body;

    // Find the user in the Teacher model
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json(ApiResponse({}, "Teacher not found", false));
    }

    // Update password properly
console.log("Before:",  teacher);
teacher.password =  req.body.password;
console.log("After:",  teacher);
    await teacher.save();

    return res.status(201).json(ApiResponse({}, "Teacher Password Updated Successfully", true));
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
  }
};


  exports.markAttendance = async (req, res) => {
    try {
      let { checkIn,checkOut,leaveReason,status,date } = req.body; 
      let teacher = await Teacher.findById(req.params.id);
      if (!teacher) {
        return res.json(ApiResponse({}, "Teacher not found", false));
      }
      let data = {};
      switch (status) {
        case "PRESENT":
          data = {
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            status: "PRESENT",
            teacher: req.params.id,
          };
          break;
        case "ABSENT":
         data = {
            checkIn: new Date(checkIn),
            checkOut: null,
            status: "ABSENT",
            teacher: req.params.id,
          };
          break;
        case "LEAVE":
        data = {
            checkIn: new Date(checkIn),
            checkOut: null,
            status: "LEAVE",
            leaveReason: leaveReason,
            teacher: req.params.id,
          };
          break;
        default:
          return res.json(ApiResponse({}, "Invalid status", false));
      }

      const attendanceRecord = new Attendance(data);
      await attendanceRecord.save();

      return res.status(200).json(ApiResponse({attendanceRecord}, "Attendance marked successfully", true));
    } catch (err) {
      res.status(500).json(ApiResponse({}, err.toString(), false));
    }
  };


  exports.updateAttendance = async (req, res) => {
    try {
      const { checkIn, checkOut, leaveReason, status } = req.body;
      const attendance = await Attendance.findById(req.params.id);

      if (!attendance) {
        return res.json(ApiResponse({}, "Attendance record not found", false));
      }

      attendance.checkIn = new Date(checkIn);
      attendance.checkOut = new Date(checkOut);
      attendance.leaveReason = leaveReason;
      attendance.status = status;

      await attendance.save();

      return res.status(200).json(ApiResponse(attendance, "Attendance updated successfully", true));
    } catch (err) {
      res.status(500).json(ApiResponse({}, err.toString(), false));
    }
  };




exports.deleteAttendance = async (req, res) => {
  try {
    let attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.json(ApiResponse({}, "Attendance record not found", false));
    }
    await Attendance.findByIdAndRemove(req.params.id);

    return res.status(200).json(ApiResponse({}, "Attendance deleted successfully", true));
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
  }
};

