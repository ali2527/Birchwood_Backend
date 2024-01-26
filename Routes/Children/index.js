const express = require("express")
const {addChild  } = require("../../Controllers/Children")
const router = express.Router()
const { signupValidator } = require("../../Validator/childValidator")

router.post("/addChild",addChildValidator, addChild);
router.post("/signin",signinValidator, signin);
router.post("/emailVerificationCode",emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode",verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword",resetPasswordValidator, resetPassword);

module.exports = router