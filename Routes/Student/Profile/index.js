const express = require("express")
const { getProfile,updateProfile,changePassword,getMyCoaches } = require("../../../Controllers/Student/profileController")
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const {uploadFile} = require("../../../Middlewares/upload")
const { changePasswordValidator } = require("../../../Validator/profileValidator")


router.get("/getProfile",authenticatedRoute,getProfile);
router.get("/getMyCoaches",authenticatedRoute,getMyCoaches);
router.post("/updateProfile",authenticatedRoute,uploadFile, updateProfile);
router.post("/changePassword",authenticatedRoute,changePasswordValidator,changePassword);

module.exports = router