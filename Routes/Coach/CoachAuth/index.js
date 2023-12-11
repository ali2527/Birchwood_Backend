const express = require("express")
const { register,signin} = require("../../../Controllers/Coach/coachAuthController");
const {emailVerificationCode,verifyRecoverCode,resetPassword} = require("../../../Controllers/Student/authController");
const router = express.Router()
const { coachSignupValidator , emailCodeValidator ,verifyCodeValidator,resetPasswordValidator,signinValidator } = require("../../../Validator/authValidator")
const {uploadFile} = require("../../../Middlewares/upload")


router.post("/register",uploadFile,coachSignupValidator, register);
router.post("/signin",signinValidator, signin);
router.post("/emailVerificationCode",emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode",verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword",resetPasswordValidator, resetPassword);

module.exports = router