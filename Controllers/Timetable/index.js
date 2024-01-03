//Models
const Timetable = require("../../Models/TimeTable");
const moment = require("moment");
//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const {
  sendNotificationToAdmin,
  sendNotificationToUser,
} = require("../../Helpers/notification");




// Add Timetable
exports.addTimetable = async (req, res) => {
    const { classroom, date, day, activities } = req.body;
  
    try {
      const newTimetable = new Timetable({
        classroom,
        day,
        startTime,
        endTime,
        description,
        subject,
        meta,
      });

      await newTimetable.save();

      return res
        .status(201)
        .json(
          ApiResponse({ newTimetable }, "Timetable Added Successfully", true)
        );
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
  
  // Get All Timetables
  exports.getAllTimetables = async (req, res) => {
    try {
      const timetables = await Timetable.find();
  
      return res.json(ApiResponse({ timetables }, "", true));
    } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
    }
  };
  
  // Get Timetable by Day
  exports.getTimetableByDay = async (req, res) => {
    const day = req.params.day.toUpperCase();
  
    try {
      const timetables = await Timetable.find({ day });
  
      return res.json(ApiResponse({ timetables }, "", true));
    } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
    }
  };
  
  // Get Timetable by Date
  exports.getTimetableByDate = async (req, res) => {
    const { date } = req.params;
  
    try {
      const timetables = await Timetable.find({ date });
  
      return res.json(ApiResponse({ timetables }, "", true));
    } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
    }
  };
  
  // Update Timetable
  exports.updateTimetable = async (req, res) => {
    try {
      const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
  
      if (!timetable) {
        return res.json(ApiResponse({}, "No timetable found", false));
      }
  
      return res.json(ApiResponse(timetable, "Timetable updated successfully", true));
    } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
    }
  };
  
  // Delete Timetable
  exports.deleteTimetable = async (req, res) => {
    try {
      const timetable = await Timetable.findByIdAndRemove(req.params.id);
  
      if (!timetable) {
        return res.json(ApiResponse({}, "Timetable not found", false));
      }
  
      return res.json(ApiResponse({}, "Timetable Deleted Successfully", true));
    } catch (error) {
      return res.json(ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false));
    }
  };
  