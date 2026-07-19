//Models
const User = require("../../Models/User");
const Event = require("../../Models/Event");
const Classroom = require("../../Models/Classroom")
const fs = require("fs")

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");



//addEvent
exports.addEvent = async (req, res) => {
    const { title,description,location,address,organizer,date,image,classroom } = req.body;
    console.log(image);
  
    try {
      const event = new Event({
        title,description,location,address,organizer,date,classroom,
        image : image ? image : ""
      });
  
      await event.save();
  
      return res.status(200).json(
        ApiResponse(
          { Event },
          
          "Event Created Successfully",
          true
        )
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

exports.getAllEvents  = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [{
      $lookup: {
        from: "classroom",
        localField: "classroom",
        foreignField: "_id",
        as: "classroom",
      },
    },
    {
      $unwind: "$classroom",
    },
  ];

    if (req.query) {
      if (req.query.keyword) {
        finalAggregate.push({
          $match: {
            $or: [
              {
                title: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              }, 
              {
                description: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },  
              {
                location: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },         
            ],
          },
        });
      }
    }

    const myAggregate = 
      finalAggregate.length > 0
        ? Event.aggregate(finalAggregate)
        : Event.aggregate([]);

    Event.aggregatePaginate(myAggregate, { page, limit }).then(
      (events) => {
        res.json(ApiResponse(events));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get event by ID
exports.getEventById = async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
  
      if (!event) {
        return res.json(ApiResponse({}, "Event not found", true));
      }
  
      return res.json(ApiResponse({ event }, "", true));
    } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
    }
  };

  //update event
exports.updateEvent = async (req, res) => {
  try {
    if (req.body.image) {
      let currentEvent = await Event.findById(req.params.id);
      if (currentEvent.image) {
        if (fs.existsSync(`./Uploads/${currentEvent.image}`)) {
          fs.unlinkSync(`./Uploads/${currentEvent.image}`);
        }

      }
    }

    let event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!event) {
      return res.json(ApiResponse({}, "No event found", false));
    }
    return res.json(ApiResponse(event, "Event updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

  
  // Delete a event
  exports.deleteEvent = async (req, res) => {
    try {
      const event = await Event.findByIdAndRemove(req.params.id);
  
      if (!event) {
        return res.json(ApiResponse({}, "Event not found", false));
      }
  
      return res.json(ApiResponse({}, "Event Deleted Successfully", true));
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


  