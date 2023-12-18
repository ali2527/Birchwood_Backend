const express = require("express")
const { signup, signin } = require("../../../Controllers/Parent/authController")
const { emailVerificationCode,verifyRecoverCode,resetPassword } = require("../../../Controllers/Auth")
const router = express.Router()
const { signupValidator , emailCodeValidator ,verifyCodeValidator,resetPasswordValidator,signinValidator } = require("../../../Validator/authValidator")

router.post("/signup",signupValidator, signup);
router.post("/signin",signinValidator, signin);
router.post("/emailVerificationCode",emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode",verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword",resetPasswordValidator, resetPassword);

module.exports = router