//Models
const Teacher = require("../../Models/Teacher");
const Admin = require("../../Models/Admin");


//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const { blackListToken } = require('../../Helpers/tokenBlacklist.js');
const path = require('path');
const fs = require('fs');

const  sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");

//libraries
const dayjs = require("dayjs");


//register
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    let admin = await Admin.findOne({ email });

    if (admin) {
      return res
        .status(400)
        .json(ApiResponse({}, "Admin with this Email Already Exist",false));
    }

    admin = new Admin({
      firstName,
      lastName,
      email,
      password,
      isAdmin: true,
      status:"ACTIVE"
    });

    await admin.save();

    return res
      .status(200)
      .json(
        ApiResponse(
          { admin },
          true,
          "Admin Created Successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(ApiResponse({},  error.message,false));
  }
};

//signin
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    Admin.findOne({ email,isAdmin:true }).then((user) => {
        if (!user) {
          return res.json(ApiResponse({}, "Admin with this email not found", false));
        }
        if (!user.authenticate(password)) { 
          return res.json(ApiResponse({}, "Invalid password!", false));
        }
        const token = generateToken(user);

        return res.json(ApiResponse({ user: sanitizeUser(user), token }, "Admin Logged In Successfully", true));
      })
      .catch((err) => {
        return res.json(ApiResponse({}, err.message, false));
      });
  } catch (error) {
    return res.status(500).json(ApiResponse({},  error.message,false));
  }
};


//update user
exports.updateProfile = async (req, res) => {
  try {
if (req.body.image) {
  let currentAdmin = await Admin.findById(req.user._id);



  if (currentAdmin.image) {
    const imagePath = path.join('./Uploads', currentAdmin.image);

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

    let user = await Admin.findByIdAndUpdate(req.user._id, req.body, {
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
    let user = await Admin.findById(req.user._id);

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


//logout
exports.logout = async (req, res) => {
  const { token } = req.body;

  try {
          blackListToken(token);
        await res
      .status(201)
      .json(ApiResponse({}, "Logout Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};