//Models
const User = require("../../Models/User");
const Coach = require("../../Models/Teacher")
//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const fs = require("fs");
const path = require('path');
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");

//get user
exports.getProfile = async (req, res) => {
  try {
    return res
      .status(200)
      .json(ApiResponse(sanitizeUser(req.user), "Found User Details", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

//update user
exports.updateProfile = async (req, res) => {
  try {
    console.log(req.user._id);
if (req.body.image) {
  let currentUser = await User.findById(req.user._id);



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

    let user = await User.findByIdAndUpdate(req.user._id, req.body, {
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
    let user = await User.findById(req.user._id);
    if (!user.authenticate(old_password)) {
      return res.json(ApiResponse({}, "Current password is Invalid!", false));
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


exports.getMyCoaches = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    // Find the student with the given req.user._id
    const student = await User.findById(req.user._id);

    if (!student) {
      return res.status(404).json(ApiResponse({}, 'Student not found', false));
    }

    // Get the coach IDs associated with the student
    const coachIds = student.coaches;

    // Find the coaches based on their IDs
    const coaches = await Coach.find({ _id: { $in: coachIds } })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json(ApiResponse(coaches, 'Coaches retrieved successfully', true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

