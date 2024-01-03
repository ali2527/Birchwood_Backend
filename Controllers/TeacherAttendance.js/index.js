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

//mark Attendance
exports.markAttendance = async (req, res) => {
  const { teacher, checkInDate,checkInTime,checkOutTime, leaveReason, sickDescription, status } = req.body;

  try {
    // Check if attendance already exists for the given child and check-in date
    let existingAttendance = await Attendance.findOne({ teacher, checkInDate });

    if (existingAttendance) {
      // Update the existing attendance record
      existingAttendance.leaveReason = leaveReason;
      existingAttendance.sickDescription = sickDescription;
      existingAttendance.status = status;

      await existingAttendance.save();

      return res.status(200).json(ApiResponse({ existingAttendance }, "Attendance Updated Successfully", true));
    }

    // Attendance does not exist, create a new one
    let existingTeacher = await Teacher.findById(teacher);

    if (!existingTeacher) {
      return res.json(ApiResponse({}, "Teacher Not Found", false));
    }

    const newAttendance = new Attendance({
      teacher,
      checkInTime,
      checkOutTime,
      checkInDate,
      leaveReason,
      sickDescription,
      status,
    });

    await newAttendance.save();

    return res.status(200).json(ApiResponse({ newAttendance }, "Attendance Marked Successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
  }
};

//get all Attendance
exports.getAllAttendance = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [
      {
        $lookup: {
          from: "teacher",
          localField: "teacher",
          foreignField: "_id",
          as: "teacher",
        },
      },
      {
        $unwind: "$teacher",
      },
      
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



// Get Attendance by ID
exports.updateAttendance = async (req, res) => {
  try {
    let attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!attendance) {
      return res.json(ApiResponse({}, "No attendance found", false));
    }

    return res.json(ApiResponse(attendance, "Attendance updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


// Get Attendance by Classroom
exports.getAttendanceByTeacher = async (req, res) => {
  try {
    const attendance = await Attendance.find({ teacher: req.params.id });

    if (!attendance) {
      return res.json(ApiResponse({}, "Attendance not found", true));
    }

    return res.json(ApiResponse({ attendance }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete a Attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndRemove(req.params.id);

    if (!attendance) {
      return res.json(ApiResponse({}, "Attendance not found", false));
    }

    return res.json(ApiResponse({}, "Attendance Deleted Successfully", true));
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
