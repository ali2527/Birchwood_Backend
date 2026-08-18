const Parent = require("../../Models/Parent");
const Children = require("../../Models/Children");
const { ApiResponse, pick } = require("../../Helpers/index");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const fs = require("fs");
const path = require("path");

const PARENT_PROFILE_FIELDS = [
  "fatherFirstName",
  "fatherLastName",
  "motherFirstName",
  "motherLastName",
  "phone",
  "address",
  "city",
  "state",
  "image",
];

exports.getProfile = async (req, res) => {
  try {
    return res
      .status(200)
      .json(ApiResponse(sanitizeUser(req.user), "Found Account Details", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = pick(req.body, PARENT_PROFILE_FIELDS);

    if (updates.image) {
      const currentUser = await Parent.findById(req.user._id);
      if (currentUser && currentUser.image) {
        const imagePath = path.join("./Uploads", currentUser.image);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (err) {
            console.error("Error while deleting the previous image:", err);
          }
        }
      }
    }

    const user = await Parent.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    });
    if (!user) {
      return res.json(ApiResponse({}, "No user found", false));
    }
    return res.json(ApiResponse(sanitizeUser(user), "User updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;

  try {
    const user = await Parent.findById(req.user._id);
    if (!user.authenticate(old_password)) {
      return res.json(ApiResponse({}, "Current password is Invalid!", false));
    }
    if (old_password == new_password) {
      return res.json(
        ApiResponse({}, "New password cannot be same as old password!", false)
      );
    }

    user.password = new_password;
    await user.save();

    return res
      .status(201)
      .json(ApiResponse({}, "Password Updated Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.getAllMyChildren = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user._id).populate({
      path: "childrens",
      populate: { path: "classroom" },
    });

    if (!parent) {
      return res.status(400).json(ApiResponse({}, "Parent not Found", false));
    }

    return res
      .status(200)
      .json(ApiResponse({ children: parent.childrens }, "Children found", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.getChildProfileById = async (req, res) => {
  try {
    const child = await Children.findById(req.params.id).populate("classroom");

    if (!child) {
      return res.status(404).json(ApiResponse({}, "Child not found", false));
    }

    const isAssigned =
      child.parent && String(child.parent) === String(req.user._id);

    if (!isAssigned) {
      return res.status(403).json(ApiResponse({}, "Access Forbidden", false));
    }

    return res.status(200).json(ApiResponse({ child }, "Child found", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};
