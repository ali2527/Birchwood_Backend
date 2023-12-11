const express = require("express")
const { getProfile,updateProfile,changePassword,getMyStudents } = require("../../../Controllers/Coach/coachProfileController")
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const {uploadFile} = require("../../../Middlewares/upload")
const { changePasswordValidator } = require("../../../Validator/profileValidator")

router.get("/getProfile",authenticatedRoute,getProfile);
router.get("/getMyStudents",authenticatedRoute,getMyStudents);
router.post("/updateProfile",authenticatedRoute,uploadFile, updateProfile);
router.post("/changePassword",authenticatedRoute,changePasswordValidator,changePassword);


module.exports = router