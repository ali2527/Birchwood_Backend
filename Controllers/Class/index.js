//Models
const User = require("../../Models/User");
const Classroom = require("../../Models/Classroom");
const Classroom = require("../../Models/Classroom");
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

exports.addClassroom = async (req, res) => {
  const { classroomName, description } = req.body;
  try {
    // Check if the student exists
    const existingclassroom = await Classroom.findOne({ classroomName });

    if (!existingclassroom) {
      return res.json(ApiResponse({}, "Classroom Already Exists", false));
    }

    // Save the classroom
    const classroom = new Classroom({
      classroomName,
      description,
    });

    await classroom.save();

    const title = "New Classroom Created";
    const content = `A new Classroom has been created. Classroom name : ${classroomName}`;
    sendNotificationToAdmin(title, content);

    return res
      .status(200)
      .json(ApiResponse({ classroom }, "Classroom Created Successfully", true));
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

exports.getAllClassroomes = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [
      {
        $sort: {
          classroomName: -1,
        },
      },
    ];

    if (req.query.status) {
      finalAggregate.push({
        $match: {
          status: req.query.status,
        },
      });
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Classroom.aggregate(finalAggregate)
        : Classroom.aggregate([]);

    Classroom.aggregatePaginate(myAggregate, { page, limit }).then((classroomes) => {
      res.json(ApiResponse(classroomes));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get classroom by ID
exports.getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.json(ApiResponse({}, "Classroom not found", true));
    }

    return res.json(ApiResponse({ classroom }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get classroom by ID
exports.updateClassroom = async (req, res) => {
  try {
    let classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!classroom) {
      return res.json(ApiResponse({}, "No classroom found", false));
    }

    return res.json(ApiResponse(classroom, "classroom updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete a classroom
exports.deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndRemove(req.params.id);

    if (!classroom) {
      return res.json(ApiResponse({}, "Classroom not found", false));
    }

    return res.json(ApiResponse({}, "Classroom Deleted Successfully", true));
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
