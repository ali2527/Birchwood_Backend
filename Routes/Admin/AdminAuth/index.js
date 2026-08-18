const express = require("express");
const {
  register,
  signin,
  updateProfile,
  changePassword,
  logout,
} = require("../../../Controllers/Admin/adminAuthController");
const {
  emailVerificationCode,
  verifyRecoverCode,
  resetPassword,
} = require("../../../Controllers/Auth");
const router = express.Router();
const {
  adminRegisterValidator,
  emailCodeValidator,
  verifyCodeValidator,
  resetPasswordValidator,
  signinValidator,
  logoutValidator,
} = require("../../../Validator/authValidator");
const { adminRoute } = require("../../../Middlewares/auth");
const { uploadFile } = require("../../../Middlewares/upload");
const { authLimiter } = require("../../../Middlewares/rateLimit");

router.post("/register", authLimiter, adminRegisterValidator, register);
router.post("/signin", authLimiter, signinValidator, signin);
router.post("/updateProfile", adminRoute, uploadFile, updateProfile);
router.post("/changePassword", adminRoute, changePassword);
router.post("/emailVerificationCode", authLimiter, emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode", authLimiter, verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword", authLimiter, resetPasswordValidator, resetPassword);
router.post("/logout", logoutValidator, logout);
router.get("/logout", logout);

module.exports = router;