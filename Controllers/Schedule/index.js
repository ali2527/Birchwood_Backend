//Models
const Coach = require("../../Models/Teacher");
const Schedule = require("../../Models/Schedule");
const fs = require("fs")

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const mongoose = require('mongoose')
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");



//addComission
exports.addSchedule = async (req, res) => {
  const { coachId, availability } = req.body;

  try {
    let coach = await Coach.findOne({_id:coachId});
    if(!coach){
      return res.json(ApiResponse({}, "Coach Not Found",false));
    }
    
    let schedule = await Schedule.findOne({ coach:coachId });

    if(!availability){
      return res.json(ApiResponse({}, "availability is Required",false));
    }


    if (schedule) {
      schedule.availability = availability;
    } else {
      // Create new schedule if not found
      schedule = new Schedule({ coach:coachId, availability });
    }

    await schedule.save();

    res.json(ApiResponse(schedule, "Schedule saved/updated successfully"));
  } catch (error) {
    res.json(ApiResponse({}, error.message, false));
  }
};



//get my schedule
exports.getMySchedule = async (req, res) => {
  const { id } = req.user;

  try {
    const isCoach = await Coach.exists({ _id: id });

    if (!isCoach) {
      return res.json(ApiResponse({}, "User is not a coach", false));
    }

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const schedule = await Schedule.aggregate([
      { $match: { coach: new mongoose.Types.ObjectId(id) } },
      { $unwind: "$availability" },
      {
        $project: {
          _id:0,
          day: "$availability.day",
          dayOfWeek: { $arrayElemAt: [daysOfWeek, "$availability.day"] }, // Map day number to day name
          timeSlots: "$availability.timeSlots",
        },
      },
    ]);


    res.json(ApiResponse(schedule));
  } catch (error) {
    res.json(ApiResponse({}, error.message, false));
  }
};


//get my schedule
exports.getScheduleByCoachId = async (req, res) => {
  const { id } = req.params;

  try {
    const isCoach = await Coach.exists({ _id: id });

    if (!isCoach) {
      return res.json(ApiResponse({}, "Coach not Found", false));
    }

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const schedule = await Schedule.aggregate([
      { $match: { coach: new mongoose.Types.ObjectId(id) } },
      { $unwind: "$availability" },
      {
        $project: {
          _id:0,
          day: "$availability.day",
          dayOfWeek: { $arrayElemAt: [daysOfWeek, "$availability.day"] }, // Map day number to day name
          timeSlots: "$availability.timeSlots",
        },
      },
    ]);


    res.json(ApiResponse(schedule));
  } catch (error) {
    res.json(ApiResponse({}, error.message, false));
  }
};

