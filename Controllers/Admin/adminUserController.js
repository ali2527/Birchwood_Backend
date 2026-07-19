//Models
const Parent = require("../../Models/Parent");
const Children = require("../../Models/Children");
const Teacher = require("../../Models/Teacher");
const Payment = require("../../Models/Payment");
const Rate = require("../../Models/Rates");
const Schedule = require("../../Models/Schedule")
const Review = require("../../Models/Review")
const mongoose = require("mongoose");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { sendNotificationToAdmin } = require("../../Helpers/notification");
const  sanitizeUser = require("../../Helpers/sanitizeUser");
const fs = require("fs");

//get user
exports.getAdmin = async (req, res) => {
  try {
    let parent = await Parent.findById(req.user._id);
    if (!parent) {
      return res.json(ApiResponse({}, "No admin found", false));
    }

    return res
      .status(200)
      .json(ApiResponse(sanitizeUser(parent), "Found Admin Details", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message,false));
  }
};

exports.updateAdmin = async (req, res) => {
  try {

      if (req.body.image) {
        let currentAdmin = await Parent.findById(req.params.id);
        
        if (currentAdmin.image) {
          const filePath = `./Uploads/${currentAdmin.image}`;
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`File '${filePath}' deleted.`);
          } else {
            console.log(`File '${filePath}' does not exist.`);
          }
        }
      }


    let admin = await Admin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!admin) {
      return res.json(ApiResponse({}, "No admin found", false));
    }
    return res.json(ApiResponse(admin, "Admin updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.toggleParentStatus = async (req, res) => {
  try {
    
    let parent = await Parent.findById(req.params.id);


      parent.status = parent.status == "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await parent.save();     

      return res.json(ApiResponse(parent, "Account Status Changed"));
  
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.toggleChildStatus = async (req, res) => {
  try {
    
    let child = await Children.findById(req.params.id);


      child.status = child.status == "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await child.save();     

      return res.json(ApiResponse(child, "Account Status Changed"));
  
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.toggleTeacherStatus = async (req, res) => {
  try {
    
    let teacher = await Teacher.findById(req.params.id);


      teacher.status = teacher.status == "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await teacher.save();     

      return res.json(ApiResponse(teacher, "Account Status Changed"));
  
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};



