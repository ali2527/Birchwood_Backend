//Models
const Coach = require("../../Models/Teacher");
const User = require("../../Models/User");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const  sanitizeUser = require("../../Helpers/sanitizeUser");
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
      .json(ApiResponse(sanitizeUser(req.user), "Found Coach Details", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message,false));
  }
};

//update user
exports.updateProfile = async (req, res) => {
  try {

    console.log(req.user._id)
    if (req.body.image) {
      let currentCoach = await Coach.findById(req.user._id);
    
      console.log("currentCoach", currentCoach);
    
      if (currentCoach.image) {
        const imagePath = path.join('./Uploads', currentCoach.image);
    
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

    let coach = await Coach.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
    });
    if (!coach) {
      return res.json(ApiResponse({}, "No Coach found", false));
    }
    return res.json(ApiResponse(coach, "Coach updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//change password
exports.changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;

  try {
    let user = await Coach.findById(req.user._id);
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

exports.getMyStudents = async (req, res) => {
  const { page, limit } = req.query;

  try {
    // Find the coach with the given req.user._id
    const coach = await Coach.findById(req.user._id);

    if (!coach) {
      return res.status(404).json(ApiResponse({}, 'Coach not found', false));
    }

    // Get the student IDs associated with the coach
    const studentIds = coach.students;

    // Find the students based on their IDs
    const students = await User.find({ _id: { $in: studentIds } })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json(ApiResponse({students,page,limit,totalDocs:studentIds.length}, 'Students retrieved successfully', true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};






