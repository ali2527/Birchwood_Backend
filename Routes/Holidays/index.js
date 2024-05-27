const express = require("express")
const {addHoliday,getAllHolidays,updateHoliday,deleteHoliday} = require("../../Controllers/Holiday");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const { uploadFile } = require("../../Middlewares/upload")
const {addHolidayValidator} = require("../../Validator/holidayValidator")

router.post("/addHoliday",authenticatedRoute,addHolidayValidator, addHoliday);
router.get("/getAllHolidays",authenticatedRoute, getAllHolidays);
router.post("/updateHoliday/:id", authenticatedRoute,updateHoliday);
router.post("/deleteHoliday/:id", authenticatedRoute,deleteHoliday);

module.exports = router