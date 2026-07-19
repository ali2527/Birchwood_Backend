//Models
const Course = require("../../Models/Course");
const Lecture = require("../../Models/Lecture");
const Quiz = require("../../Models/Quiz");
const Attempt = require("../../Models/Attempt");

const moment = require("moment");

//Helpers
const {
  createVideoFrame,
  getVideoDuration,
} = require("../../Helpers/videoFrame");
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { sendNotificationToAdmin,sendNotificationToUser } = require("../../Helpers/notification");
const mongoose = require("mongoose");

exports.addQuiz = async (req, res) => {
  const {
    title,
    description,
    course,
    lecture,
    quizDate,
    passingPercentage,
    questions,
  } = req.body;

  try {
    const existingCourse = await Course.findById(course);

    if (!existingCourse) {
      return res.json(ApiResponse({}, "Course Not Found ", false));
    }

    const existingLecture = await Lecture.findById(lecture);

    if (!existingLecture) {
      return res.json(ApiResponse({}, "Lecture Not Found", false));
    }

    const quiz = new Quiz({
      title,
      description,
      course,
      lecture,
      quizDate,
      passingPercentage,
      questions,
    });

    await quiz.save();

    const title2 = "New Quiz Created";
    const content2 = `A new quiz has been created.Course : ${existingCourse.title} , Lecture : ${existingLecture.title}`;
    sendNotificationToAdmin(title2, content2);

    return res
      .status(200)
      .json(ApiResponse({ quiz }, "Quiz Created Successfully", true));
  } catch (error) {
    console.log(error);
    return res.json(
      ApiResponse(
        {},
        errorHandler(error) ? errorHandler(error) : error.message,
        false
      )
    );
  }
};

exports.getAllQuiz = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status } = req.query;

    let finalAggregate = [
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $lookup: {
          from: "lectures",
          localField: "lecture",
          foreignField: "_id",
          as: "lecture",
        },
      },
      {
        $unwind: "$lecture",
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

    if (status) {
      finalAggregate.push({
        $match: {
          status: req.query.status,
        },
      });
    }

    if (from) {
      finalAggregate.push({
        $match: {
          quizDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          quizDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    const myAggregate =
      finalAggregate.length > 0
        ? Quiz.aggregate(finalAggregate)
        : Quiz.aggregate([]);

    Quiz.aggregatePaginate(myAggregate, { page, limit }).then((quiz) => {
      res.json(ApiResponse(quiz));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllQuizByLecture = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status } = req.query;
    let { lecture } = req.params;

    let finalAggregate = [
      {
        $match: { lecture: new mongoose.Types.ObjectId(lecture) },
      },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $lookup: {
          from: "lectures",
          localField: "lecture",
          foreignField: "_id",
          as: "lecture",
        },
      },
      {
        $unwind: "$lecture",
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

    if (status) {
      finalAggregate.push({
        $match: {
          status: req.query.status,
        },
      });
    }

    if (from) {
      finalAggregate.push({
        $match: {
          quizDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          quizDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    finalAggregate.push({
      $lookup: {
        from: "attempts",
        let: { quizId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$quiz", "$$quizId"] },
                  { $eq: ["$user",new mongoose.Types.ObjectId(req.user._id)] }, // Assuming you have user information in req.user
                ],
              },
            },
          },
          {
            $sort: { createdAt: -1 }, // Sort attempts by date in descending order
          },
          {
            $limit: 1, // Limit to only the last attempt
          },
        ],
        as: "userAttempt",
      },
    },{
      $unwind:"$userAttempt"
    });



    const myAggregate =
      finalAggregate.length > 0
        ? Quiz.aggregate(finalAggregate)
        : Quiz.aggregate([]);

    Quiz.aggregatePaginate(myAggregate, { page, limit }).then((quiz) => {
      res.json(ApiResponse(quiz));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


// Get course by ID
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("lecture")
      .populate("course");

    if (!quiz) {
      return res.json(ApiResponse({}, "Quiz not found", true));
    }

    return res.json(ApiResponse({ quiz }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get course by ID
exports.updateQuiz = async (req, res) => {
  try {
    let quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!quiz) {
      return res.json(ApiResponse({}, "No quiz found", false));
    }

    return res.json(ApiResponse(quiz, "Quiz updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete a course
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndRemove(req.params.id);

    if (!quiz) {
      return res.json(ApiResponse({}, "Quiz not found", false));
    }

    return res.json(ApiResponse({}, "Quiz Deleted Successfully", true));
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

exports.attemptQuiz = async (req, res) => {
  const { quiz, score, responses } = req.body;
  let user = req.user._id;
  try {
    const existingAttempt = await Attempt.findOne({
      user,
      quiz,
      status: "PASSED",
    });
    if (existingAttempt) {
      return res.json(ApiResponse({}, "Quiz already Passed", false));
    }

    const existingQuiz = await Quiz.findById(quiz);

    if (!existingQuiz) {
      return res.json(ApiResponse({}, "Quiz not found", false));
    }

    const totalScore = existingQuiz.totalScore;

    // Initialize the user's score
    let userScore = 0;

    for (const response of responses) {
      const question = existingQuiz.questions.find(
        (q) => q._id == response.question
      );

      console.log(">>>>>>",question.correctOption);
      console.log(">>>>>>",response.answer);

      if (question) {
        // Check if the provided answer matches the correct answer
        if (question.correctOption == response.answer) {
          userScore += question.score;
        }
      }
    }

    // Calculate the user's percentage score
    const percentageScore = (userScore / totalScore) * 100;

    //   // Determine if the user passed or failed
    const passingPercentage = existingQuiz.passingPercentage;
    const status = percentageScore >= passingPercentage ? "PASSED" : "FAILED";

    //   // Create an attempt record
    const attempt = new Attempt({
      user: req.user._id, // Assuming you have user authentication
      quiz: quiz,
      score: userScore,
      responses,
      status,
    });

    //   // Save the attempt to the database
    await attempt.save();

    const title2 = "New Quiz Attempt";
    const content2 = `A new quiz has been attempted.`;
    sendNotificationToAdmin(title2, content2);

    const title3 = "Quiz Submitted Successfully";
    const content3 = `Your Quiz has been Submitted.`;
    sendNotificationToUser(user, title3, content3);

    return res
      .status(200)
      .json(ApiResponse({ attempt }, `Quiz ${status}`, true));
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

