const express = require("express");
const {
  addHoliday,
  getAllHolidays,
  updateHoliday,
  deleteHoliday,
} = require("../../Controllers/Holiday");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../Middlewares/auth");
const { addHolidayValidator } = require("../../Validator/holidayValidator");

router.post("/addHoliday", adminRoute, addHolidayValidator, addHoliday);
router.get("/getAllHolidays", authenticatedRoute, getAllHolidays);
router.post("/updateHoliday/:id", adminRoute, updateHoliday);
router.post("/deleteHoliday/:id", adminRoute, deleteHoliday);

module.exports = router;
