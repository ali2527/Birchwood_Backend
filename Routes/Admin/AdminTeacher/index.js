const express = require("express")
const {addTeacher} = require("../../../Controllers/Admin/adminTeacherController")
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const {uploadFile} = require("../../../Middlewares/upload")
const {addTeacherValidator} = require("../../../Validator/teacherValidator")


router.post("/addTeacher",authenticatedRoute,uploadFile,addTeacherValidator,addTeacher)



module.exports = router