const express = require("express")
const { assignChild,updateProfile,changePassword } = require("../../../Controllers/Children/childProfileController")
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const {uploadFile} = require("../../../Middlewares/upload")
const { changePasswordValidator } = require("../../../Validator/profileValidator")


router.post("/assignChild",authenticatedRoute,assignChild);
// router.post("/updateProfile",authenticatedRoute,uploadFile, updateProfile);
// router.post("/changePassword",authenticatedRoute,changePasswordValidator,changePassword);

module.exports = router