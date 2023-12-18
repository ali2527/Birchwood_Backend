//Models
const User = require("../../Models/User");
const Class = require("../../Models/Class");
const Class = require("../../Models/Class");
const Rates = require("../../Models/Rates");
const Commission = require("../../Models/Commission");
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

exports.addClass = async (req, res) => {
  const { className, description } = req.body;
  try {
    // Check if the student exists
    const existingclass = await Class.findOne({ className });

    if (!existingclass) {
      return res.json(ApiResponse({}, "Class Already Exists", false));
    }

    // Save the classroom
    const classroom = new Class({
      className,
      description,
    });

    await classroom.save();

    const title = "New Class Created";
    const content = `A new Class has been created. Class name : ${className}`;
    sendNotificationToAdmin(title, content);

    return res
      .status(200)
      .json(ApiResponse({ classroom }, "Class Created Successfully", true));
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

exports.getAllClasses = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [
      {
        $sort: {
          className: -1,
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
        ? Class.aggregate(finalAggregate)
        : Class.aggregate([]);

    Class.aggregatePaginate(myAggregate, { page, limit }).then((classes) => {
      res.json(ApiResponse(classes));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get classroom by ID
exports.getClassById = async (req, res) => {
  try {
    const classroom = await Class.findById(req.params.id);

    if (!classroom) {
      return res.json(ApiResponse({}, "Class not found", true));
    }

    return res.json(ApiResponse({ classroom }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get classroom by ID
exports.updateClass = async (req, res) => {
  try {
    let classroom = await Class.findByIdAndUpdate(req.params.id, req.body, {
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
exports.deleteClass = async (req, res) => {
  try {
    const classroom = await Class.findByIdAndRemove(req.params.id);

    if (!classroom) {
      return res.json(ApiResponse({}, "Class not found", false));
    }

    return res.json(ApiResponse({}, "Class Deleted Successfully", true));
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
