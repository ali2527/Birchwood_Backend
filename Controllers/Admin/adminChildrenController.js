//Models
const User = require("../../Models/User");
const Children = require("../../Models/Children");
const Classroom = require("../../Models/Classroom");

const fs = require("fs");
const crypto = require("crypto");
const KJUR = require("jsrsasign");
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
const Parent = require("../../Models/Parent");

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
      
      return res.status(400).json(
        ApiResponse(
          {},
          "A Child with this rollnumber already exists",
          false
        )
      );
    }


    const child = new Children({
      ...req.body,
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
      console.log(req.query);
      if (req.query.keyword) {
        finalAggregate.push({
        $match: {
          $or: [
            { firstName: { $regex: ".*" + req.query.keyword.toLowerCase() + ".*", $options: "i" } },
            { lastName: { $regex: ".*" + req.query.keyword.toLowerCase() + ".*", $options: "i" } },
            { rollNumber: { $regex: ".*" + req.query.keyword.toLowerCase() + ".*", $options: "i" } },
            {term: { $regex: ".*" + req.query.keyword.toLowerCase() + ".*", $options: "i" } },
          ],
        },
        });
      }

      if (req.query.parent) {
        finalAggregate.push({
          $match: {
            parent: new mongoose.Types.ObjectId(req.query.parent),
          },
        });
      }

      if (req.query.classroom) {
        finalAggregate.push({
          $match: {
            "classroom._id": new mongoose.Types.ObjectId(req.query.classroom),
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
    const child = await Children.findById(req.params.id).populate("classroom").populate("parent");

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

    // const todayStart = new Date();
    // todayStart.setHours(0, 0, 0, 0); // Start of today
    // const todayEnd = new Date(todayStart.getTime() + 86400000); // Start of tomorrow
    
    const todayStart = moment().utc().startOf("day").toDate();
    const todayEnd = moment().utc().endOf("day").toDate();

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
      {
        $lookup: {
          from: "parents",
          localField: "parent",
          foreignField: "_id",
          as: "parent",
        },
      },
      {
        $unwind: "$parent",
      },
      {
          $lookup: {
            from: "attendances",
            let: { childId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$children", "$$childId"] },
                      { $gte: ["$checkIn", todayStart] },
                      { $lt: ["$checkIn", todayEnd] },
                    ],
                  },
                },
              },
            ],
            as: "todayAttendance",
          },
        },
        {
          $set: {
            todayAttendance: { $arrayElemAt: ["$todayAttendance", 0] },
          },
        },
        {
          $set: {
            todayAttendance: {
              $cond: {
                if: { $eq: ["$todayAttendance", null] },
                then: "$$REMOVE",
                else: "$todayAttendance",
              },
            },
          },
        },
      {
          $lookup: {
            from: "chats",
            let: { childId: "$_id", parentId: "$parent._id", teacherId: "$classroom.teacher" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$children", "$$childId"] },
                      { $eq: ["$parent", "$$parentId"] },
                      { $eq: ["$teacher", "$$teacherId"] }
                    ],
                  },
                },
              },
            ],
            as: "chats",
          },
        },
        {
          $set: {
            chats: { $arrayElemAt: ["$chats", 0] },
          },
        },
        {
          $set: {
            chats: {
              $cond: {
                if: { $eq: ["$chats", null] },
                then: "$$REMOVE",
                else: "$chats",
              },
            },
          },
        }
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

exports.searchParents = async (req, res) => {
  try {
    const { keyword } = req.query;

    let query = { status: "ACTIVE" };

    if (keyword) {
      query = {
        $and: [
          { status: "ACTIVE" },
          {
            $or: [
              { fatherFirstName: { $regex: keyword, $options: "i" } },
              { motherFirstName: { $regex: keyword, $options: "i" } },
              { fatherLastName: { $regex: keyword, $options: "i" } },
              { motherLastName: { $regex: keyword, $options: "i" } },
              { email: { $regex: keyword, $options: "i" } },
            ],
          },
        ],
      };
    }

    // Fetch parents with limit (if no keyword limit 10 else no limit)
    const parents = await Parent.find(query).limit(keyword ? 0 : 10);

    // Get total count separately but still in same function
    const totalDocs = await Parent.countDocuments(query);

    return res.json(ApiResponse({ parents, totalDocs }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
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
