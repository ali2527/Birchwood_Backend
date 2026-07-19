const express = require("express")
const { register,signin,updateProfile,changePassword,logout} = require("../../../Controllers/Admin/adminAuthController");
const {emailVerificationCode,verifyRecoverCode,resetPasswordAdmin} = require("../../../Controllers/Auth");
const router = express.Router()
const { adminRegisterValidator , emailCodeValidator ,verifyCodeValidator,resetPasswordValidator,signinValidator,logoutValidator } = require("../../../Validator/authValidator");
const { adminRoute } = require("../../../Middlewares/auth");
const { uploadFile } = require("../../../Middlewares/upload");

router.post("/register",adminRegisterValidator, register);
router.post("/signin",signinValidator, signin);
router.post("/updateProfile",adminRoute,uploadFile,updateProfile);
router.post("/changePassword",adminRoute,changePassword);
router.post("/emailVerificationCode",emailCodeValidator, emailVerificationCode);
router.post("/verifyRecoverCode",verifyCodeValidator, verifyRecoverCode);
router.post("/resetPassword",resetPasswordValidator, resetPasswordAdmin);
router.post("/logout",logoutValidator, logout);

module.exports = router