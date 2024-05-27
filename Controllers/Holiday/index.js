//Models
const Holiday = require("../../Models/Holiday");
const moment = require("moment");
//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const {
  sendNotificationToAdmin,
  sendNotificationToUser,
} = require("../../Helpers/notification");

// Add Holiday
exports.addHoliday = async (req, res) => {
  const { name, date } = req.body;

  try {
    const newHoliday = new Holiday({
      name,
      date,
    });

    await newHoliday.save();

    return res
      .status(201)
      .json(ApiResponse({ newHoliday }, "Holiday Added Successfully", true));
  } catch (error) {
    return res.json(
      ApiResponse(
        {},
        errorHandler(error) ? errorHandler(error) : error.message,
        false
      )
    );
  }
};

// Get All Holidays
exports.getAllHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find();

    return res.json(ApiResponse({ holidays }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Update Holiday
exports.updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!holiday) {
      return res.json(ApiResponse({}, "No holiday found", false));
    }

    return res.json(ApiResponse(holiday, "Holiday updated successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete Holiday
exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndRemove(req.params.id);

    if (!holiday) {
      return res.json(ApiResponse({}, "Holiday not found", false));
    }

    return res.json(ApiResponse({}, "Holiday Deleted Successfully", true));
  } catch (error) {
    return res.json(
      ApiResponse(
        {},
        errorHandler(error) ? errorHandler(error) : error.message,
        false
      )
    );
  }
};
