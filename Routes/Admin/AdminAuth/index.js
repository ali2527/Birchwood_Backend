const express = require("express")
const { register,signin} = require("../../../Controllers/Admin/adminAuthController");
const {emailVerificationCode,verifyRecoverCode,resetPassword} = require("../../../Controllers/Student/authController");
const router = express.Router()
const { adminRegisterValidator , emailCodeValidator ,verifyCodeValidator,resetPasswordValidator,signinValidator } = require("../../../Validator/authValidator")

router.post("/register",adminRegisterValidator, register);
router.post("/signin",signinValidator, signin);
router.post("/emailVerificationCode",emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode",verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword",resetPasswordValidator, resetPassword);

module.exports = router