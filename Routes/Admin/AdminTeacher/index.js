const express = require("express");
const {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherAttendanceByMonth,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  searchClassrooms,
  resetTeacherPassword,
} = require("../../../Controllers/Admin/adminTeacherController");
const router = express.Router();
const { adminRoute } = require("../../../Middlewares/auth");
const { uploadFile } = require("../../../Middlewares/upload");
const { addTeacherValidator, resetPasswordValidator } = require("../../../Validator/teacherValidator");

router.post("/addTeacher", adminRoute, uploadFile, addTeacherValidator, addTeacher);
router.get("/getAllTeachers", adminRoute, getAllTeachers);
router.get("/searchClassrooms", adminRoute, searchClassrooms);
router.get("/getTeacherById/:id", adminRoute, getTeacherById);
router.post("/updateTeacher/:id", adminRoute, uploadFile, updateTeacher);
router.post("/resetTeacherPassword/:id", adminRoute, resetPasswordValidator, resetTeacherPassword);
router.get("/deleteTeacher/:id", adminRoute, deleteTeacher);
router.get("/getTeacherAttendanceByMonth/:id", adminRoute, getTeacherAttendanceByMonth);
router.post("/markAttendance/:id", adminRoute, markAttendance);
router.post("/updateAttendance/:id", adminRoute, updateAttendance);
router.post("/deleteAttendance/:id", adminRoute, deleteAttendance);

module.exports = router;
