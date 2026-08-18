const express = require("express");
const { signin } = require("../../../Controllers/Teacher/authController");
const { emailVerificationCode, verifyRecoverCode, resetPassword } = require("../../../Controllers/Auth");
const router = express.Router();
const {
  emailCodeValidator,
  verifyCodeValidator,
  resetPasswordValidator,
  signinValidator,
} = require("../../../Validator/authValidator");
const { authLimiter } = require("../../../Middlewares/rateLimit");

router.post("/signin", authLimiter, signinValidator, signin);
router.post("/emailVerificationCode", authLimiter, emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode", authLimiter, verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword", authLimiter, resetPasswordValidator, resetPassword);

module.exports = router;
