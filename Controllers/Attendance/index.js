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


//addInventory
exports.markAttendance = async (req, res) => {
  const {
    children,
    checkInDate,
    leaveReason,
    sickDescription,
    status,
  } = req.body;

  try {
    let child = Children.findById(children)

    if(!child){
        return res.json(ApiResponse({}, "Child Not Found", false));
    }

    if(!child.class){
        return res.json(ApiResponse({}, "Child is not assigned to any class", false));
    }

    const checkIn = new Attendance({
        children,
        class:child.class,
        checkInDate,
        leaveReason,
        sickDescription,
        status,
      });
  

    await checkIn.save();

    return res
      .status(200)
      .json(ApiResponse({ child }, "CheckIn Marked Successfully", true));
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



exports.getAllAttendance = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [
      {
        $lookup: {
          from: "class",
          localField: "classroom",
          foreignField: "_id",
          as: "classroom",
        },
      },
      {
        $unwind: "$classroom",
      },
    ];

    if (req.query) {
      if (req.query.keyword) {
        finalAggregate.push({
          $match: {
            $or: [
              {
                firstName: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
                lastName: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },
            ],
          },
        });
      }

      if (req.query.parent) {
        finalAggregate.push({
          $match: {
            parent: req.query.parent,
          },
        });
      }

      if (req.query.classroom) {
        finalAggregate.push({
          $match: {
            classroom: req.query.classroom,
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
        ? Children.aggregate(finalAggregate)
        : Children.aggregate([]);

    Children.aggregatePaginate(myAggregate, { page, limit }).then(
      (children) => {
        res.json(ApiResponse(children));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get inventory by ID
exports.getChildById = async (req, res) => {
  try {
    const child = await Children.findById(req.params.id);

    if (!child) {
      return res.json(ApiResponse({}, "Child not found", true));
    }

    return res.json(ApiResponse({ child }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get inventory by Category
exports.getChildrenByClass = async (req, res) => {
  try {
    const children = await Children.find({ classroom: req.params.id });

    if (!children) {
      return res.json(ApiResponse({}, "Children not found", true));
    }

    return res.json(ApiResponse({ children }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.updateChild = async (req, res) => {
  try {
    if (req.body.image) {
      let currentChild = await Children.findById(req.params.id);

      if (currentChild.image) {
        const filePath = `./Uploads/${currentChild.image}`;

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`File '${filePath}' deleted.`);
        } else {
          console.log(`File '${filePath}' does not exist.`);
        }
      }
    }

    let child = await Children.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!child) {
      return res.json(ApiResponse({}, "No child found", false));
    }

    return res.json(ApiResponse(child, "Child Profile updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

//toggleStatus
exports.toggleStatus = async (req, res) => {
  try {
    let child = await Children.findById(req.params.id);

    child.status = child.status == "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await child.save();

    return res.json(ApiResponse(child, "Child Status Changed"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete a inventory
exports.deleteChild = async (req, res) => {
  try {
    const child = await Children.findByIdAndRemove(req.params.id);

    if (!child) {
      return res.json(ApiResponse({}, "Child Profile not found", false));
    }

    return res.json(
      ApiResponse({}, "Child Profile Deleted Successfully", true)
    );
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
