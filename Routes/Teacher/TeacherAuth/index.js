const express = require("express")
const { register,signin} = require("../../../Controllers/Teacher/authController");
const {emailVerificationCode,verifyRecoverCode,resetPassword} = require("../../../Controllers/Auth");
const router = express.Router()
const { teacherSignupValidator , emailCodeValidator ,verifyCodeValidator,resetPasswordValidator,signinValidator } = require("../../../Validator/authValidator")
const {uploadFile} = require("../../../Middlewares/upload")


router.post("/register",uploadFile,teacherSignupValidator, register);
router.post("/signin",signinValidator, signin);
router.post("/emailVerificationCode",emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode",verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword",resetPasswordValidator, resetPassword);

module.exports = router