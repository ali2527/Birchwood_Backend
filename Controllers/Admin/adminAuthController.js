const Teacher = require("../../Models/Teacher");
const Parent = require("../../Models/Parent");
const Admin = require("../../Models/Admin");
const { generateAdminToken, ApiResponse, pick } = require("../../Helpers/index");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const fs = require("fs");
const path = require("path");

const ADMIN_PROFILE_FIELDS = ["firstName", "lastName", "image"];

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

exports.register = async (req, res) => {
  if (process.env.ALLOW_ADMIN_REGISTER !== "true") {
    return res.status(403).json(ApiResponse({}, "Admin registration is disabled", false));
  }
  const { firstName, lastName, password } = req.body;
  const email = normalizeEmail(req.body.email);
  try {
    const [teacher, parent, existingAdmin] = await Promise.all([
      Teacher.findOne({ email }),
      Parent.findOne({ email }),
      Admin.findOne({ email }),
    ]);

    if (parent || teacher || existingAdmin) {
      return res
        .status(400)
        .json(ApiResponse({}, "User with this Email Already Exist", false));
    }

    const admin = new Admin({
      firstName,
      lastName,
      email,
      password,
      isAdmin: true,
      status: "ACTIVE",
    });

    await admin.save();

    return res.status(200).json(
      ApiResponse({ admin: sanitizeUser(admin) }, "Admin Created Successfully", true)
    );
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.signin = async (req, res) => {
  const password = req.body.password;
  const email = normalizeEmail(req.body.email);

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.json(ApiResponse({}, "Admin with this email not found", false));
    }
    if (admin.status !== "ACTIVE") {
      return res.json(ApiResponse({}, "Admin account is not active", false));
    }
    if (!admin.authenticate(password)) {
      return res.json(ApiResponse({}, "Invalid password!", false));
    }

    const token = generateAdminToken(admin);
    return res.json(
      ApiResponse({ user: sanitizeUser(admin), token }, "Admin Logged In Successfully", true)
    );
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = pick(req.body, ADMIN_PROFILE_FIELDS);

    if (updates.image) {
      const currentUser = await Admin.findById(req.user._id);
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

    const admin = await Admin.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    });
    if (!admin) {
      return res.json(ApiResponse({}, "No admin found", false));
    }
    return res.json(ApiResponse(sanitizeUser(admin), "Admin updated successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;

  try {
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.json(ApiResponse({}, "No admin found", false));
    }
    if (!admin.authenticate(old_password)) {
      return res.json(ApiResponse({}, "Current password is Invalid!", false));
    }
    if (old_password == new_password) {
      return res.json(
        ApiResponse({}, "New password cannot be same as old password!", false)
      );
    }

    admin.password = new_password;
    await admin.save();

    return res
      .status(201)
      .json(ApiResponse({}, "Password Updated Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.logout = async (req, res) => {
  try {
    return res.json(ApiResponse({}, "Logged out successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};
