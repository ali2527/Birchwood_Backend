//Models
const Homework = require("../../Models/Homework");
const moment = require("moment");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { sendNotificationToAdmin } = require("../../Helpers/notification");
const {generateRandom6DigitID} = require("../../Helpers");
const { isAfter } = require("validator");
const { default: mongoose } = require("mongoose");
const Children = require("../../Models/Children");


exports.addHomework = async (req, res) => {
  const {
    title,
    description,
    children,
    classroom,
    teacher,
    dueDate,
    assignDate,
    assignee,
    type } = req.body;
  try {
  
    const homework = new Homework({
      title,
    description,
    children,
    classroom,
    teacher,
    dueDate,
    assignDate:new Date(),  
    assignee,
    type,
    });

    await homework.save();

    const title2 = "New Homework Created";
    const content2 = `A new homework has been created`;
    sendNotificationToAdmin(title2, content2);

    return res
      .status(200)
      .json(ApiResponse({ homework }, "Homework Created Successfully", true));
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

exports.getAllHomework = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword,children,type,assignee, from, to, status } = req.query;

    let finalAggregate = [
      {
        $sort: {
          assignDate: 1,
        },
      },
    ];

    if (keyword) {
      const regex = new RegExp(keyword.toLowerCase(), "i");
      finalAggregate.push({
        $match: {
          $or: [
            { title: { $regex: regex } },
            { description: { $regex: regex } },
          ],
        },
      });
    }

    if(children){
      finalAggregate.push({
        $match:{
          children:new mongoose.Types.ObjectId(children)
        }
      })
    }

    if(type){
      finalAggregate.push({
        $match:{type}
      })
    }

    if(assignee){
      finalAggregate.push({
        $match:{assignee}
      })
    }

    if (from) {
      finalAggregate.push({
        $match: {
          dueDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          dueDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Homework.aggregate(finalAggregate)
        : Homework.aggregate([]);

    Homework.aggregatePaginate(myAggregate, { page, limit }).then(
      (homeworks) => {
        res.json(ApiResponse(homeworks));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllChildHomework = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status } = req.query;

    let children = await Children.findById(req.params.id);

    let finalAggregate = [{
      $match:{
        $or: [
          { children }, 
          { classroom:new mongoose.Types.ObjectId(children.classroom) },
        ],
        
      }
    },
      {
        $sort: {
          assignDate: 1,
        },
      },
    ];


    if (from) {
      finalAggregate.push({
        $match: {
          dueDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          dueDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Homework.aggregate(finalAggregate)
        : Homework.aggregate([]);

    Homework.aggregatePaginate(myAggregate, { page, limit }).then(
      (homeworks) => {
        res.json(ApiResponse(homeworks));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get homework by ID
exports.getHomeworkById = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)

    if (!homework) {
      return res.json(ApiResponse({}, "Homework not found", true));
    }

    return res.json(ApiResponse({ homework }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get homework by ID
exports.updateHomework = async (req, res) => {
  try {
    let homework = await Homework.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!homework) {
      return res.json(ApiResponse({}, "No Homework found", false));
    }

    return res.json(ApiResponse(homework, "Homework updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


// Delete a homework
exports.deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findByIdAndRemove(req.params.id);

    if (!homework) {
      return res.json(ApiResponse({}, "Homework not found", false));
    }

    return res.json(ApiResponse({}, "Homework Deleted Successfully", true));
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
