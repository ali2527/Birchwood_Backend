const express = require("express")
const { getProfile,updateProfile,changePassword,assignChild,getAllMyChildren, getChildProfileById } = require("../../../Controllers/Parent/profileController")
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const {uploadFile} = require("../../../Middlewares/upload")
const { changePasswordValidator } = require("../../../Validator/profileValidator")


router.get("/getProfile",authenticatedRoute,getProfile);
router.post("/updateProfile",authenticatedRoute,uploadFile, updateProfile);
router.post("/changePassword",authenticatedRoute,changePasswordValidator,changePassword);
router.post("/assignChild",authenticatedRoute,assignChild);
router.get("/getAllMyChildren",authenticatedRoute,getAllMyChildren);
router.get("/getChildProfileById/:id", authenticatedRoute, getChildProfileById);

module.exports = router