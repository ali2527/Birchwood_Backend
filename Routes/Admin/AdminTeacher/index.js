const express = require("express");
const {
  addTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../../../Controllers/Admin/adminTeacherController");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../../Middlewares/auth");
const { uploadFile } = require("../../../Middlewares/upload");
const { addTeacherValidator } = require("../../../Validator/teacherValidator");

router.post("/addTeacher", adminRoute, uploadFile, addTeacherValidator, addTeacher);
router.get("/getAllTeachers", authenticatedRoute, getAllTeachers);
router.get("/getTeacherById/:id", authenticatedRoute, getTeacherById);
router.post("/updateTeacher/:id", adminRoute, uploadFile, updateTeacher);
router.get("/deleteTeacher/:id", adminRoute, deleteTeacher);

module.exports = router;
