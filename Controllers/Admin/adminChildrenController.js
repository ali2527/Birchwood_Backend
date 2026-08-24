//Models
const Children = require("../../Models/Children");
const Classroom = require("../../Models/Classroom");
const Parent = require("../../Models/Parent");

const fs = require("fs");
const crypto = require("crypto");
const moment = require("moment");
//Helpers
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
exports.addChild = async (req, res) => {
  const {
    rollNumber,
    term,
    firstName,
    lastName,
    age,
    birthday,
    homeNumber,
    image,
    classroom,
  } = req.body;

  try {

    let currentChild = await Children.findOne({rollNumber});

    if(currentChild){
      return res.json(
        ApiResponse(
          {},
          "A Child with this rollnumber already exists",
          false
        )
      );
    }


    const child = new Children({
      rollNumber,
      term,
      firstName,
      lastName,
      age,
      birthday,
      homeNumber,
      classroom,
      image,
    });

    await child.save();

    return res
      .status(200)
      .json(ApiResponse({ child }, "Child Created Successfully", true));
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

exports.searchParents = async (req, res) => {
  try {
    const { keyword } = req.query;
    const filter = {};
    if (keyword) {
      filter.$or = [
        { fatherFirstName: { $regex: keyword, $options: "i" } },
        { fatherLastName: { $regex: keyword, $options: "i" } },
        { motherFirstName: { $regex: keyword, $options: "i" } },
        { motherLastName: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ];
    }
    const parents = await Parent.find(filter)
      .select("_id fatherFirstName fatherLastName motherFirstName motherLastName email phone status")
      .limit(keyword ? 50 : 10)
      .sort({ createdAt: -1 });
    return res.json(ApiResponse({ parents }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllChildren = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [
      {
        $lookup: {
          from: "classrooms", 
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
exports.getChildrenByClassroom = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.json(ApiResponse({}, "Classroom not found", true));
    }


    let finalAggregate = [
      {
        $match: {
          classroom:  new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "classrooms",
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

exports.updateChild = async (req, res) => {
  try {
    const childId = req.params.id || req.body.id || req.body._id;
    if (req.body.image) {
      let currentChild = await Children.findById(childId);

      if (currentChild && currentChild.image) {
        const filePath = `./Uploads/${currentChild.image}`;

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    let child = await Children.findByIdAndUpdate(childId, req.body, {
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


    if (child.image) {
      const filePath = `./Uploads/${child.image}`;

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File '${filePath}' deleted.`);
      } else {
        console.log(`File '${filePath}' does not exist.`);
      }
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
