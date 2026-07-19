//Models
const mongoose = require("mongoose");
const Parent = require("../../Models/Parent");
const Children = require("../../Models/Children");

//Helpers
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const { sendChildAssignmentNotification } = require("../../Helpers/sockets");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const fs = require("fs");
const path = require('path');


//get user
exports.getProfile = async (req, res) => {
  try {
    return res
      .status(200)
      .json(ApiResponse(sanitizeUser(req.user), "Found Account Details", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

//update user
exports.updateProfile = async (req, res) => {
  try {
    console.log(req.body);
if (req.body.image) {
  let currentUser = await Parent.findById(req.user._id);



  if (currentUser.image) {
    const imagePath = path.join('./Uploads', currentUser.image);

    // Check if the file exists before attempting to delete it
    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
        console.log('Previous image deleted successfully.');
      } catch (err) {
        console.error('Error while deleting the previous image:', err);
      }
    } else {
      console.log('Previous image not found in Uploads folder.');
    }
  }
}

    let user = await Parent.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
    });
    if (!user) {
      return res.json(ApiResponse({}, "No user found", false));
    }
    return res.json(ApiResponse(user, "User updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

//change password
exports.changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;

  try {
    let user = await Parent.findById(req.user._id);
    if (!user.authenticate(old_password)) {
      return res.json(ApiResponse({}, "Current password is Invalid!", false));
    }
    if(old_password == new_password){
      return res.json(ApiResponse({}, "New password cannot be same as old password!", false));

    }

    user.password = new_password;
    await user.save();

    await res
      .status(201)
      .json(ApiResponse({}, "Password Updated Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

//assign child
exports.assignChild = async (req, res) => {
    try {
      // Find the child by ID
      const child = await Children.findById(req.body.child);
  
      if (!child) {
        return res.status(200).json(ApiResponse({}, "Child not Found", true));
      }
  
      // Check if the child already has a parent assigned
      if (child.parent) {
        return res.status(400).json(ApiResponse({}, "Child already has a parent assigned", true));
      }
  
      // Find the parent by ID (req.user._id)
      const parent = await Parent.findById(req.user._id);
  
      if (!parent) {
        return res.status(200).json(ApiResponse({}, "Parent not Found", true));
      }
  
      // Add the child to the parent's childrens array
      parent.childrens.push(child._id);
  
      // Add the parent to the child's parent field
      child.parent = parent._id;
  

         // Send notification to the parent socket
         sendChildAssignmentNotification(parent._id, child);

      
      // Save changes to both parent and child
      await parent.save();
      await child.save();
  
      return res.status(200).json(ApiResponse({}, "Child assigned successfully", false));
  
    } catch (error) {
      return res.status(500).json(ApiResponse({}, error.message, false));
    }
  };
  

// exports.getAllMyChildren = async (req, res) => {
//   try {
//     const parent = await Parent.findById(req.user._id);
//     if (!parent) {
//       return res.json(ApiResponse({}, "Parent not found", false));
//     }

//     let finalAggregate = [
//       {
//         $match: {
//           parent: new mongoose.Types.ObjectId(req.user._id),
//         },
//       },
//       {
//         $lookup: {
//           from: "parents",
//           localField: "parent",
//           foreignField: "_id",
//           as: "parent",
//         },
//       },
//       {
//         $unwind: "$parent",
//       },
//       {
//         $lookup: {
//           from: "classrooms",
//           localField: "classroom",
//           foreignField: "_id",
//           as: "classroom",
//         },
//       },
//       {
//         $unwind: {
//           path: "$classroom",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//     ];

//     const children = await Children.aggregate(finalAggregate);

//     if (!children.length) {
//       return res.json(ApiResponse([], "No children found", false));
//     }

//     return res.json(ApiResponse(children, "Children found"));
//   } catch (error) {
//     return res.status(500).json(ApiResponse({}, error.message, false));
//   }
// };

exports.getAllMyChildren = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user._id);
    if (!parent) {
      return res.json(ApiResponse({}, "Parent not found", false));
    }

    // Get today's start and end time
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Start of today
    const todayEnd = new Date(todayStart.getTime() + 86400000); // Start of tomorrow

    let finalAggregate = [
  {
    $match: {
      _id: { $in: parent.childrens }, // Get only this parent's children
    },
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
      from: "classrooms",
      localField: "classroom",
      foreignField: "_id",
      as: "classroom",
    },
  },
  {
    $unwind: {
      path: "$classroom",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "teachers", // The teachers collection name
      localField: "classroom.teacher", // Reference teacher ID inside classroom
      foreignField: "_id",
      as: "classroom.teacher",
    },
  },
  {
    $unwind: {
      path: "$classroom.teacher",
      preserveNullAndEmptyArrays: true, // Keep classroom even if no teacher exists
    },
  },
  {
    $lookup: {
      from: "attendances", // The attendance collection name
      let: { childId: "$_id" }, // Reference child ID
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$children", "$$childId"] }, // Match attendance record by child ID
                { $gte: ["$checkIn", todayStart] }, // Attendance after today start
                { $lt: ["$checkIn", todayEnd] }, // Attendance before today end
              ],
            },
          },
        },
      ],
      as: "attendance",
    },
  },
  {
    $addFields: {
      attendance: {
        $cond: {
          if: { $gt: [{ $size: "$attendance" }, 0] }, // Check if attendance exists
          then: { $arrayElemAt: ["$attendance", 0] }, // Get the first (only) attendance record
          else: {}, // If no attendance, return an empty object
        },
      },
    },
  },
   {
    $lookup: {
      from: "chats", // The chatroom collection
      localField: "parent._id", // Match chatroom based on parent's ID
      foreignField: "parent", // Assuming chatrooms have a field referencing the parent
      as: "chats",
    },
  },
  {
    $unwind: {
      path: "$chats",
      preserveNullAndEmptyArrays: true, // Keep the record even if no chatroom exists
    },
  },
];


    const children = await Children.aggregate(finalAggregate);

    if (!children.length) {
      return res.json(ApiResponse([], "No children found", false));
    }

    return res.json(ApiResponse(children, "Children found"));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.getChildProfileById = async (req, res) => {
  try {
    const child = await Children.findById(req.params.id).populate({
      path: 'classroom',
      populate: {
        path: 'teacher',
      },
    });

    if (!child) {
      return res.json(ApiResponse({}, "Child not found", true));
    }

    return res.json(ApiResponse({ child }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};
