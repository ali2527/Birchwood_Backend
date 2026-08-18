const express = require("express");
const {
  addClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom,
} = require("../../Controllers/Classroom");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../Middlewares/auth");
const { addClassroomValidator } = require("../../Validator/classValidator");

router.post("/addClassroom", adminRoute, addClassroomValidator, addClassroom);
router.get("/getAllClassrooms", authenticatedRoute, getAllClassrooms);
router.get("/getClassroomById/:id", authenticatedRoute, getClassroomById);
router.post("/updateClassroom/:id", adminRoute, updateClassroom);
router.get("/deleteClassroom/:id", adminRoute, deleteClassroom);

module.exports = router;
