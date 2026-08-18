const Parent = require("../../Models/Parent");
const Children = require("../../Models/Children");
const moment = require("moment");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const fs = require("fs");
const path = require("path");

exports.assignChild = async (req, res) => {
  try {
    const rollNumber = String(req.body.rollNumber || "").trim();
    const birthday = req.body.birthday;

    const parent = await Parent.findById(req.user._id);
    if (!parent) {
      return res.status(400).json(ApiResponse({}, "Parent not Found", false));
    }

    const child = await Children.findOne({ rollNumber });
    const birthdayMatches =
      child &&
      child.birthday &&
      moment(birthday).isValid() &&
      moment(child.birthday).isSame(moment(birthday), "day");

    if (!child || !birthdayMatches) {
      return res
        .status(400)
        .json(ApiResponse({}, "Child details do not match", false));
    }

    if (child.parent) {
      return res
        .status(400)
        .json(ApiResponse({}, "Child already has a parent assigned", false));
    }

    if (!parent.childrens.includes(child._id)) {
      parent.childrens.push(child._id);
    }
    child.parent = parent._id;

    await parent.save();
    await child.save();

    return res
      .status(200)
      .json(ApiResponse({ child }, "Child assigned successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

//update user
// exports.updateProfile = async (req, res) => {
//   try {
//     console.log(req.user._id);
// if (req.body.image) {
//   let currentUser = await Parent.findById(req.user._id);



//   if (currentUser.image) {
//     const imagePath = path.join('./Uploads', currentUser.image);

//     // Check if the file exists before attempting to delete it
//     if (fs.existsSync(imagePath)) {
//       try {
//         fs.unlinkSync(imagePath);
//         console.log('Previous image deleted successfully.');
//       } catch (err) {
//         console.error('Error while deleting the previous image:', err);
//       }
//     } else {
//       console.log('Previous image not found in Uploads folder.');
//     }
//   }
// }

//     let user = await Parent.findByIdAndUpdate(req.user._id, req.body, {
//       new: true,
//     });
//     if (!user) {
//       return res.json(ApiResponse({}, "No user found", false));
//     }
//     return res.json(ApiResponse(user, "User updated successfully"));
//   } catch (error) {
//     return res.json(ApiResponse({}, error.message, false));
//   }
// };

// //change password
// exports.changePassword = async (req, res) => {
//   const { old_password, new_password } = req.body;

//   try {
//     let user = await Parent.findById(req.user._id);
//     if (!user.authenticate(old_password)) {
//       return res.json(ApiResponse({}, "Current password is Invalid!", false));
//     }
//     if(old_password == new_password){
//       return res.json(ApiResponse({}, "New password cannot be same as old password!", false));

//     }

//     user.password = new_password;
//     await user.save();

//     await res
//       .status(201)
//       .json(ApiResponse({}, "Password Updated Successfully", true));
//   } catch (error) {
//     return res.status(500).json(ApiResponse({}, error.message, false));
//   }
// };


exports.removeChild = async (req, res) => {
    try {
      // Find the child by ID
      const child = await Children.findById(req.body.child);
  
      if (!child) {
        return res.status(200).json(ApiResponse({}, "Child not Found", true));
      }
  
      // Check if the child has a parent assigned
      if (!child.parent) {
        return res.status(400).json(ApiResponse({}, "Child does not have a parent assigned", true));
      }
  
      // Find the parent by ID (req.user._id)
      const parent = await Parent.findById(req.user._id);
  
      // Check if the child is in the parent's childrens array
      const isChildInParentArray = parent.childrens.includes(child._id);
  
      if (!isChildInParentArray) {
        return res.status(400).json(ApiResponse({}, "This is not your child", true));
      }
  
      // Remove the child from the parent's childrens array
      parent.childrens = parent.childrens.filter(childId => childId.toString() !== child._id.toString());
  
      // Remove the parent from the child's parent field
      child.parent = null;
  
      // Save changes to both parent and child
      await parent.save();
      await child.save();
  
      return res.status(200).json(ApiResponse({}, "Child removed successfully", true));
  
    } catch (error) {
      return res.status(500).json(ApiResponse({}, error.message, false));
    }
  };