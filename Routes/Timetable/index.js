const express = require("express");
const {
  addTimetable,
  getAllClassTimetables,
  getTimetableByDayAndClass,
  updateTimetable,
  deleteTimetable,
} = require("../../Controllers/Timetable");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../Middlewares/auth");
const { addTimeTableValidator } = require("../../Validator/timeTableValidator");

router.post("/addTimetable", adminRoute, addTimeTableValidator, addTimetable);
router.get("/getAllClassTimetables/:classroom", authenticatedRoute, getAllClassTimetables);
router.get("/getTimetableByDayAndClass", authenticatedRoute, getTimetableByDayAndClass);
router.post("/updateTimetable/:id", adminRoute, updateTimetable);
router.get("/deleteTimetable/:id", adminRoute, deleteTimetable);

module.exports = router;
