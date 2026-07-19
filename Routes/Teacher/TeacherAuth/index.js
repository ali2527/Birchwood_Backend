const express = require("express")
const { register,signin} = require("../../../Controllers/Teacher/authController");
const {emailVerificationCode,verifyRecoverCode,resetPasswordTeacher} = require("../../../Controllers/Auth");
const router = express.Router()
const {  emailCodeValidator ,verifyCodeValidator,resetPasswordValidator,signinValidator } = require("../../../Validator/authValidator")
const {uploadFile} = require("../../../Middlewares/upload")

router.post("/signin",signinValidator, signin);
router.post("/emailVerificationCode",emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode",verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword",resetPasswordValidator, resetPasswordTeacher);

module.exports = router