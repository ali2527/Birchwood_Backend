//Models
const Holiday = require("../../Models/Holiday");
//Helpers
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");

const AUDIENCES = ["STUDENT", "TEACHER", "BOTH"];

function parseDate(value, label) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return parsed;
}

function normalizeHolidayPayload(body = {}) {
  const start = parseDate(body.date, "start date");
  if (!start) {
    throw new Error("Start date is required");
  }

  let end = body.endDate ? parseDate(body.endDate, "end date") : start;
  if (end < start) {
    end = start;
  }

  const audience = AUDIENCES.includes(body.audience) ? body.audience : "BOTH";

  const payload = {
    name: String(body.name || "").trim(),
    date: start,
    audience,
    endDate: undefined,
  };

  if (!payload.name) {
    throw new Error("Holiday name is required");
  }

  if (end.getTime() !== start.getTime()) {
    payload.endDate = end;
  }

  return payload;
}

// Add Holiday
exports.addHoliday = async (req, res) => {
  try {
    const payload = normalizeHolidayPayload(req.body);
    const newHoliday = new Holiday(payload);
    await newHoliday.save();

    return res
      .status(201)
      .json(ApiResponse({ newHoliday }, "Holiday Added Successfully", true));
  } catch (error) {
    const message = error.message || "Failed to add holiday";
    const status = message.includes("required") || message.includes("Invalid") ? 400 : 500;
    return res.status(status).json(
      ApiResponse({}, errorHandler(error) ? errorHandler(error) : message, false)
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
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.json(ApiResponse({}, "No holiday found", false));
    }

    const payload = normalizeHolidayPayload(req.body);
    holiday.name = payload.name;
    holiday.date = payload.date;
    holiday.audience = payload.audience;
    holiday.endDate = payload.endDate;
    await holiday.save();

    return res.json(ApiResponse(holiday, "Holiday updated successfully", true));
  } catch (error) {
    const message = error.message || "Failed to update holiday";
    const status = message.includes("required") || message.includes("Invalid") ? 400 : 500;
    return res.status(status).json(ApiResponse({}, message, false));
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
