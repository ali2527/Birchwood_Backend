//Models
const User = require("../../Models/User");
const Children = require("../../Models/Children");
const Classroom = require("../../Models/Classroom");
const Parent = require("../../Models/Parent");

const fs = require("fs");
const crypto = require("crypto");
const KJUR = require("jsrsasign");
const moment = require("moment");
//Helpers
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString,generateRandom6DigitID } = require("../../Helpers/index");
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


// Add a new parent
exports.addParent = async (req, res) => {
  const {
    fatherFirstName,
    fatherLastName,
    motherFirstName,
    motherLastName,
    email,
    phone,
    password,
    address,
    city,
    state,
    image,
    zip
  } = req.body;

  try {
    let existingParent = await Parent.findOne({ email });

    if (existingParent) {
      return res.json(ApiResponse({}, "Parent with this email already exists", false));
    }

    const parent = new Parent({
      parentId: generateRandom6DigitID("P"),     
      fatherFirstName,
      fatherLastName,
      motherFirstName,
      motherLastName,
      email,
      phone,
      password,
      address,
      city,
      state,
      image,
      zip
    });

    await parent.save();

    return res.status(200).json(ApiResponse({ parent }, "Parent Created Successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
  }
};


//searchStudents
exports.searchStudents = async (req, res) => {
  try {
    const { keyword } = req.query;

    //if not keyword return 10 students
    if (!keyword) {
      const students = await Children.find({status:"ACTIVE"}).limit(10);
      return res.json(ApiResponse({ students }, "", true));
    }

    const students = await Children.find({
      $or: [
        { firstName: { $regex: keyword, $options: "i" } },
        { lastName: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    },{status:"ACTIVE"});

    return res.json(ApiResponse({ students }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
  }
};
// Get all parents
exports.getAllParent = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [{
      $lookup:{
        from: "childrens",
        localField: "_id",
        foreignField: "parent",
        as: "childrens",}
    }];

    if (req.query.keyword) {
      finalAggregate.push({
        $match: {
          $or: [
            { firstName: { $regex: ".*" + req.query.keyword.toLowerCase() + ".*", $options: "i" } },
            { lastName: { $regex: ".*" + req.query.keyword.toLowerCase() + ".*", $options: "i" } },
            { email: { $regex: ".*" + req.query.keyword.toLowerCase() + ".*", $options: "i" } },
            {parentId: { $regex: ".*" + req.query.keyword.toLowerCase() + ".*", $options: "i" } },
          ],
        },
      });
    }

    if(req.query.status){
      finalAggregate.push({
        $match: {
          status: req.query.status
        }
      });
    }

    if(req.query.studentId){
      finalAggregate.push({
        $match: {
          "childrens._id": new mongoose.Types.ObjectId(req.query.studentId)
        }
      });
    }


    const myAggregate = finalAggregate.length > 0 ? Parent.aggregate(finalAggregate) : Parent.aggregate([]);

    Parent.aggregatePaginate(myAggregate, { page, limit }).then((parents) => {
      res.json(ApiResponse(parents));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get parent by ID
exports.getParentById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);

    if (!parent) {
      return res.json(ApiResponse({}, "Parent not found", true));
    }

    return res.json(ApiResponse({ parent }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Update parent
exports.updateParent = async (req, res) => {
  
  try {
    if (req.body.image) {
      let currentParent = await Parent.findById(req.params.id);

      if (currentParent.image) {
        const filePath = `./Uploads/${currentParent.image}`;

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`File '${filePath}' deleted.`);
        } else {
          console.log(`File '${filePath}' does not exist.`);
        }
      }
    }


    let parent = await Parent.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!parent) {
      return res.json(ApiResponse({}, "No parent found", false));
    }

    return res.json(ApiResponse(parent, "Parent Profile updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Toggle parent status
exports.toggleStatus = async (req, res) => {
  try {
    let parent = await Parent.findById(req.params.id);

    parent.status = parent.status == "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await parent.save();

    return res.json(ApiResponse(parent, "Parent Status Changed"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//reset Teacher password
exports.resetParentPassword = async (req, res) => {
  try {
    // Find the user in the Teacher model
    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json(ApiResponse({}, "Parent not found", false));
    }

parent.password =  req.body.password;
    await parent.save();

    return res.status(201).json(ApiResponse({}, "Parent Password Updated Successfully", true));
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
  }
};


// Delete a parent
exports.deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndRemove(req.params.id);

    if (!parent) {
      return res.json(ApiResponse({}, "Parent Profile not found", false));
    }

    if (parent.image) {
      const filePath = `./Uploads/${parent.image}`;

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File '${filePath}' deleted.`);
      } else {
        console.log(`File '${filePath}' does not exist.`);
      }
    }

    return res.json(ApiResponse({}, "Parent Profile Deleted Successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
  }
};