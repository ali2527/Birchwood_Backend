const express = require("express")
const {addSchedule,getAllSChedules,getMySchedule,getScheduleByCoachId} = require("../../Controllers/Schedule");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {addScheduleValidator} = require("../../Validator/scheduleValidator")

router.post("/addSchedule",authenticatedRoute,addScheduleValidator,addSchedule);
router.get("/getMySchedule", authenticatedRoute,getMySchedule);
router.get("/getScheduleByCoachId/:id", getScheduleByCoachId);


module.exports = router