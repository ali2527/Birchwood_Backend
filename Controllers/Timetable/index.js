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
  const { classroom, startTime, endTime, day, description,subject, meta } = req.body;
  
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
  exports.getAllClassTimetables = async (req, res) => {
    const { classroom } = req.params; // Assuming the classroom is in the URL parameters
    const { day } = req.query; // Assuming day filter is in the query parameters

    try {
      // Fetch all timetables for the given classroom
      let timetables = await Timetable.find({ classroom });
  
      // If a specific day is provided in the query, filter the timetables by that day
      if (day) {
        timetables = timetables.filter(timetable => timetable.day === day);
      }
  
      // Group the timetables by day
      const timetablesByDay = timetables.reduce((groupedTimetables, timetable) => {
        const { day } = timetable;
        if (!groupedTimetables[day]) {
          groupedTimetables[day] = [];
        }
        groupedTimetables[day].push(timetable);
        return groupedTimetables;
      }, {});
  
      return res.json(ApiResponse({...timetablesByDay }, "", true));
    } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
    }
  };


  exports.getTimetableByDayAndClass = async (req, res) => {
  const { classroom, day } = req.query;

  try {
    const timetable = await Timetable.find({ classroom, day: day.toUpperCase() });

    return res.json(ApiResponse({ timetable }, "", true));
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
  