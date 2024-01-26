//Models
const Teacher = require("../../Models/Teacher");
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




//get user
exports.getProfile = async (req, res) => {
  try {
    return res
      .status(200)
      .json(ApiResponse(sanitizeUser(req.user), "Found Teacher Details", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message,false));
  }
};

//update user
exports.updateProfile = async (req, res) => {
  try {

    console.log(req.user._id)
    if (req.body.image) {
      let currentTeacher = await Teacher.findById(req.user._id);
    
      console.log("currentTeacher", currentTeacher);
    
      if (currentTeacher.image) {
        const imagePath = path.join('./Uploads', currentTeacher.image);
    
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

    let teacher = await Teacher.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
    });
    if (!teacher) {
      return res.json(ApiResponse({}, "No Teacher found", false));
    }
    return res.json(ApiResponse(teacher, "Teacher updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//change password
exports.changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;

  try {
    let user = await Teacher.findById(req.user._id);
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







