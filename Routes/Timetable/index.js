const express = require("express")
const {addTimetable,getAllClassTimetables,getTimetableByDayAndClass,updateTimetable,deleteTimetable} = require("../../Controllers/Timetable");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const { uploadFile } = require("../../Middlewares/upload")
const {addTimeTableValidator} = require("../../Validator/timeTableValidator")

router.post("/addTimetable",authenticatedRoute,addTimeTableValidator, addTimetable);
router.get("/getAllClassTimetables/:classroom",authenticatedRoute, getAllClassTimetables);
router.get("/getTimetableByDayAndClass", authenticatedRoute,getTimetableByDayAndClass);
router.post("/updateTimetable/:id", authenticatedRoute,updateTimetable);
router.get("/deleteTimetable/:id", authenticatedRoute,deleteTimetable);

module.exports = router