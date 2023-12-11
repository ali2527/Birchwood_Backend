//Models
const User = require("../../Models/User");
const Coach = require("../../Models/Teacher");
const Lesson = require("../../Models/Lesson");
const Rates = require("../../Models/Rates");
const Commission = require("../../Models/Commission");
const fs = require("fs");
const crypto = require('crypto')
const KJUR = require('jsrsasign')
const moment = require("moment")
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
const mongoose = require("mongoose");


exports.getLessonsByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    const startOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10) + 1}-01`).startOf("month").toDate();
    const endOfMonth = moment(`${parseInt(year, 10)}-${parseInt(month, 10) + 1}-01`).endOf("month").toDate();

    console.log(startOfMonth)

    const lessons = await Lesson.find({
      lessonDate: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate("coach").populate("student");

    res.json(ApiResponse(lessons));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllPendingLessons = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let { keyword, from, to,type } = req.query;

    let finalAggregate = [];

      finalAggregate.push(
        {
          $lookup: {
            from: "coaches",
            localField: "coach",
            foreignField: "_id",
            as: "coach",
          },
        },
        {
          $unwind: "$coach",
        }, {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $unwind: "$student",
        }
      );

      if (keyword) {
        const regex = new RegExp(keyword.toLowerCase(), "i");
        finalAggregate.push({
          $match: {
            $or: [
              { lessonId: { $regex: regex } },
              { subject: { $regex: regex } },
              {
                $and: [
                  { coach: { $exists: true } }, // Ensure we are searching coaches' first names
                  {
                    $or: [
                      { "coach.firstName": { $regex: regex } },
                      { "coach.lastName": { $regex: regex } },
                    ],
                  },
                ],
              },
              {
                $and: [
                  { student: { $exists: true } }, // Ensure we are searching students' first names
                  {
                    $or: [
                      { "student.firstName": { $regex: regex } },
                      { "student.lastName": { $regex: regex } },
                    ],
                  },
                ],
              },
            ],
          },
        });
      }
      

      if (type) {
        finalAggregate.push({
          $match: {
            lessonType: req.query.type,
          },
        });
      }
  
      if (from) {
        finalAggregate.push({
          $match: {
            lessonDate: {
              $gte: moment(from).startOf("day").toDate(),
              $lte: moment(new Date()).endOf("day").toDate(),
            },
          },
        });
      }
  
      if (to) {
        finalAggregate.push({
          $match: {
            lessonDate: {
              $lte: moment(to).endOf("day").toDate(),
            },
          },
        });
      }
  
   

    finalAggregate.push({
      $match: {
        status: "PENDING",
      },
    });

    const myAggregate =
      finalAggregate.length > 0
        ? Lesson.aggregate(finalAggregate)
        : Lesson.aggregate([]);

    Lesson.aggregatePaginate(myAggregate, { page, limit }).then((lessons) => {
      res.json(ApiResponse(lessons));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllUpcomingLessons = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let { keyword, status, from, to , type } = req.query;

    let finalAggregate = [];

      finalAggregate.push(
        {
          $lookup: {
            from: "coaches",
            localField: "coach",
            foreignField: "_id",
            as: "coach",
          },
        },
        {
          $unwind: "$coach",
        }, {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $unwind: "$student",
        }
      );

   
    if (keyword) {
      const regex = new RegExp(keyword.toLowerCase(), "i");
      finalAggregate.push({
        $match: {
          $or: [
            { lessonId: { $regex: regex } },
            { subject: { $regex: regex } },
            {
              $and: [
                { coach: { $exists: true } }, // Ensure we are searching coaches' first names
                {
                  $or: [
                    { "coach.firstName": { $regex: regex } },
                    { "coach.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
            {
              $and: [
                { student: { $exists: true } }, // Ensure we are searching students' first names
                {
                  $or: [
                    { "student.firstName": { $regex: regex } },
                    { "student.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
          ],
        },
      });
    }

    finalAggregate.push({
      $match: {
        status: { $in: ["UPCOMING", "PENDING"] },
      },
    });  

    if (type) {
      finalAggregate.push({
        $match: {
          lessonType: req.query.type,
        },
      });
    }

    if (from) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }


    const myAggregate =
      finalAggregate.length > 0
        ? Lesson.aggregate(finalAggregate)
        : Lesson.aggregate([]);

    

    Lesson.aggregatePaginate(myAggregate, { page, limit }).then((lessons) => {
      res.json(ApiResponse(lessons));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllLiveLessons = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let { keyword, status, from, to , type } = req.query;

    let finalAggregate = [];

      finalAggregate.push(
        {
          $lookup: {
            from: "coaches",
            localField: "coach",
            foreignField: "_id",
            as: "coach",
          },
        },
        {
          $unwind: "$coach",
        }, {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $unwind: "$student",
        }
      );

   
    if (keyword) {
      const regex = new RegExp(keyword.toLowerCase(), "i");
      finalAggregate.push({
        $match: {
          $or: [
            { lessonId: { $regex: regex } },
            { subject: { $regex: regex } },
            {
              $and: [
                { coach: { $exists: true } }, // Ensure we are searching coaches' first names
                {
                  $or: [
                    { "coach.firstName": { $regex: regex } },
                    { "coach.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
            {
              $and: [
                { student: { $exists: true } }, // Ensure we are searching students' first names
                {
                  $or: [
                    { "student.firstName": { $regex: regex } },
                    { "student.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
          ],
        },
      });
    }

    finalAggregate.push({
      $match: {
        status: "LIVE",
      },
    }); 



  
    if (type) {
      finalAggregate.push({
        $match: {
          lessonType: req.query.type,
        },
      });
    }

    if (from) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Lesson.aggregate(finalAggregate)
        : Lesson.aggregate([]);

    

    Lesson.aggregatePaginate(myAggregate, { page, limit }).then((lessons) => {
      res.json(ApiResponse(lessons));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllCompletedLessons = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let { keyword, status, from, to , type } = req.query;

    let finalAggregate = [];

      finalAggregate.push(
        {
          $lookup: {
            from: "coaches",
            localField: "coach",
            foreignField: "_id",
            as: "coach",
          },
        },
        {
          $unwind: "$coach",
        }, {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $unwind: "$student",
        }
      );

   
    if (keyword) {
      const regex = new RegExp(keyword.toLowerCase(), "i");
      finalAggregate.push({
        $match: {
          $or: [
            { lessonId: { $regex: regex } },
            { subject: { $regex: regex } },
            {
              $and: [
                { coach: { $exists: true } }, // Ensure we are searching coaches' first names
                {
                  $or: [
                    { "coach.firstName": { $regex: regex } },
                    { "coach.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
            {
              $and: [
                { student: { $exists: true } }, // Ensure we are searching students' first names
                {
                  $or: [
                    { "student.firstName": { $regex: regex } },
                    { "student.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
          ],
        },
      });
    }


     finalAggregate.push({
        $match: {
          status: "COMPLETED",
        },
      }); 



    if (type) {
      finalAggregate.push({
        $match: {
          lessonType: req.query.type,
        },
      });
    }

    if (from) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }



    const myAggregate =
      finalAggregate.length > 0
        ? Lesson.aggregate(finalAggregate)
        : Lesson.aggregate([]);


    Lesson.aggregatePaginate(myAggregate, { page, limit }).then((lessons) => {
      res.json(ApiResponse(lessons));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllRejectedLessons = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let { keyword, status, from, to , type } = req.query;

    let finalAggregate = [];

      finalAggregate.push(
        {
          $lookup: {
            from: "coaches",
            localField: "coach",
            foreignField: "_id",
            as: "coach",
          },
        },
        {
          $unwind: "$coach",
        }, {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $unwind: "$student",
        }
      );

   
    if (keyword) {
      const regex = new RegExp(keyword.toLowerCase(), "i");
      finalAggregate.push({
        $match: {
          $or: [
            { lessonId: { $regex: regex } },
            { subject: { $regex: regex } },
            {
              $and: [
                { coach: { $exists: true } }, // Ensure we are searching coaches' first names
                {
                  $or: [
                    { "coach.firstName": { $regex: regex } },
                    { "coach.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
            {
              $and: [
                { student: { $exists: true } }, // Ensure we are searching students' first names
                {
                  $or: [
                    { "student.firstName": { $regex: regex } },
                    { "student.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
          ],
        },
      });
    }

    finalAggregate.push({
      $match: {
        status: "REJECTED",
      },
    });


    if (type) {
      finalAggregate.push({
        $match: {
          lessonType: req.query.type,
        },
      });
    }

    if (from) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Lesson.aggregate(finalAggregate)
        : Lesson.aggregate([]);

    Lesson.aggregatePaginate(myAggregate, { page, limit }).then((lessons) => {
      res.json(ApiResponse(lessons));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllMissedLessons = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let { keyword, status, from, to , type } = req.query;

    let finalAggregate = [];

      finalAggregate.push(
        {
          $lookup: {
            from: "coaches",
            localField: "coach",
            foreignField: "_id",
            as: "coach",
          },
        },
        {
          $unwind: "$coach",
        }, {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $unwind: "$student",
        }
      );

   
    if (keyword) {
      const regex = new RegExp(keyword.toLowerCase(), "i");
      finalAggregate.push({
        $match: {
          $or: [
            { lessonId: { $regex: regex } },
            { subject: { $regex: regex } },
            {
              $and: [
                { coach: { $exists: true } }, // Ensure we are searching coaches' first names
                {
                  $or: [
                    { "coach.firstName": { $regex: regex } },
                    { "coach.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
            {
              $and: [
                { student: { $exists: true } }, // Ensure we are searching students' first names
                {
                  $or: [
                    { "student.firstName": { $regex: regex } },
                    { "student.lastName": { $regex: regex } },
                  ],
                },
              ],
            },
          ],
        },
      });
    }

    finalAggregate.push({
      $match: {
        status: "MISSED",
      },
    });

    if (type) {
      finalAggregate.push({
        $match: {
          lessonType: req.query.type,
        },
      });
    }

    if (from) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          lessonDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Lesson.aggregate(finalAggregate)
        : Lesson.aggregate([]);

    Lesson.aggregatePaginate(myAggregate, { page, limit }).then((lessons) => {
      res.json(ApiResponse(lessons));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get lesson by ID
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate("coach").populate("student");

    if (!lesson) {
      return res.json(ApiResponse({}, "Lesson not found", true));
    }

    return res.json(ApiResponse({ lesson }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete a lesson
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndRemove(req.params.id);

    if (!lesson) {
      return res.json(ApiResponse({}, "Lesson not found", false));
    }

    return res.json(ApiResponse({}, "Lesson Deleted Successfully", true));
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
