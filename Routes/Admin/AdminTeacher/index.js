const express = require("express")
const {addTeacher,getAllTeachers,getTeacherById,assignClass,markAttendance,searchClassrooms,updateAttendance,updateTeacher,getTeacherAttendanceByMonth,resetTeacherPassword,deleteTeacher,deleteAttendance} = require("../../../Controllers/Admin/adminTeacherController")
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const {uploadFile} = require("../../../Middlewares/upload")
const {addTeacherValidator,resetPasswordValidator,markAttendanceValidator} = require("../../../Validator/teacherValidator")


router.post("/addTeacher",authenticatedRoute,uploadFile,addTeacherValidator,addTeacher)
router.get("/getAllTeachers",authenticatedRoute,getAllTeachers)
router.get("/getTeacherById/:id",authenticatedRoute,getTeacherById)
router.post("/updateTeacher/:id",authenticatedRoute,uploadFile,updateTeacher)
router.post("/assignClass/:id",authenticatedRoute,assignClass);
router.get("/getTeacherAttendanceByMonth/:id",authenticatedRoute,getTeacherAttendanceByMonth)
router.get("/deleteTeacher/:id", authenticatedRoute, deleteTeacher);
router.post("/resetTeacherPassword/:id",adminRoute,resetPasswordValidator,resetTeacherPassword)
router.post("/deleteAttendance/:id",authenticatedRoute,deleteAttendance)
router.post("/markAttendance/:id",authenticatedRoute,markAttendanceValidator,markAttendance)
router.post("/updateAttendance/:id",authenticatedRoute,updateAttendance)
router.get("/searchClassrooms",authenticatedRoute,searchClassrooms)
module.exports = router