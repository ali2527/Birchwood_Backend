const express = require("express")
const { signup,emailVerificationCode,verifyRecoverCode,resetPassword, signin } = require("../../../Controllers/Student/authController")
const router = express.Router()
const { signupValidator , emailCodeValidator ,verifyCodeValidator,resetPasswordValidator,signinValidator } = require("../../../Validator/authValidator")

router.post("/signup",signupValidator, signup);
router.post("/signin",signinValidator, signin);
router.post("/emailVerificationCode",emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode",verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword",resetPasswordValidator, resetPassword);

module.exports = router