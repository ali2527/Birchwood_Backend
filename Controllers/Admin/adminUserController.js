//Models
const User = require("../../Models/User");
const Coach = require("../../Models/Teacher");
const Lesson = require("../../Models/Lesson");
const Payment = require("../../Models/Payment");
const Rate = require("../../Models/Rates");
const Schedule = require("../../Models/Schedule")
const Review = require("../../Models/Review")
const mongoose = require("mongoose");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { sendNotificationToAdmin } = require("../../Helpers/notification");
const  sanitizeUser = require("../../Helpers/sanitizeUser");
const fs = require("fs");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");

//libraries
const dayjs = require("dayjs");

//modules
const moment = require("moment");


//get user
exports.getAdmin = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user) {
      return res.json(ApiResponse({}, "No admin found", false));
    }

    return res
      .status(200)
      .json(ApiResponse(sanitizeUser(user), "Found Admin Details", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message,false));
  }
};

function roundToHalf(num) {
  return Math.round(num * 2) / 2;
}


    
//get all students with pagination
exports.getAllStudents = async (req, res) => {
  const { page = 1, limit = 10, status, from, to, keyword } = req.query;
  try {
    let finalAggregate = [];

    if (keyword) {
      finalAggregate.push({
        $match: {
          $or: [
            {
              firstName: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
            {
              lastName: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
            {
              email: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
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
          createdAt: {
            $gte: moment(from).startOf("day").toDate(),
            $lte: moment(new Date()).endOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          createdAt: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    finalAggregate.push(
      {
        $match:{isAdmin:false}
      },{
      $project: {
        salt: 0,
        hashed_password: 0,
      },
    });

    const myAggregate =

      finalAggregate.length > 0
        ? User.aggregate(finalAggregate).sort({ firstName: 1 })
        : User.aggregate([]);

    User.aggregatePaginate(myAggregate, { page, limit }, (err, users) => {
      if (err) {
        return res.json(
          ApiResponse(
            {},
            errorHandler(err) ? errorHandler(err) : err.message,
            false
          )
        );
      }
      if (!users ){
        return res.json(ApiResponse({}, "No students found", false));
      }

      return res.json(ApiResponse(users));
    }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};



exports.getAllCoaches = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    from,
    to,
    keyword,
    maxHourlyRate,
    minHourlyRate,
    subjects,
    daysToFilter,
  } = req.query;

  try {
    let finalAggregate = [];

    finalAggregate.push({
      $lookup: {
        from: "rates",
        localField: "_id",
        foreignField: "coach",
        as: "rate",
      },
    });

    finalAggregate.push({
      $match: {
        applicationType: { $in: ["BOTH", "COACHING"] },
      },
    },
    {
      $match: {
        status:"ACTIVE",
      },
    });

    finalAggregate.push({
      $project: {
        salt: 0,
        hashed_password: 0,
      },
    });

    // Filter by keyword if provided
    if (keyword) {
      finalAggregate.push({
        $match: {
          $or: [
            {
              firstName: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
            {
              lastName: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
            {
              email: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
          ],
        },
      });
    }

    // Filter by status if provided
    if (status) {
      finalAggregate.push({
        $match: {
          status: status,
        },
      });
    }

    // Filter by hourly rate range if provided
    if (maxHourlyRate) {
      finalAggregate.push({
        $match: {
          "rate.hourlyRate": { $lte: parseInt(maxHourlyRate) },
        },
      });
    }

    if (minHourlyRate) {
      finalAggregate.push({
        $match: {
          "rate.hourlyRate": { $gte: parseInt(minHourlyRate) },
        },
      });
    }

    // Filter by subjects if provided
    if (subjects) {
      const subjectArray = subjects.split(",");
      finalAggregate.push({
        $match: {
          subjects: { $in: subjectArray },
        },
      });
    }

    // Get all coaches' data
    const myAggregate =
      finalAggregate.length > 0 ? Coach.aggregate(finalAggregate).sort({ firstName: 1 }) : Coach.aggregate([]);

    const coaches = await Coach.aggregatePaginate(myAggregate, { page, limit });

    if (!coaches) {
      return res.json(ApiResponse({}, "No Coaches found", false));
    }

    const coachIds = coaches.docs.map((coach) => coach._id);
    const rates1 = await Rate.find({ coach: { $in: coachIds } });

    // Get reviews for each coach and calculate averageRating directly in the aggregation pipeline
    const reviews1 = await Review.aggregate([
      { $match: { coach: { $in: coachIds } } },
      {
        $group: {
          _id: "$coach",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $project: {
          averageRating: {
            $divide: [{ $trunc: { $multiply: ["$averageRating", 2] } }, 2],
          },
          totalReviews: 1,
        },
      },
    ]);

    // If daysToFilter is not provided, return all coaches without availability filtering
    if (!daysToFilter) {
      
      const coachesWithoutAvailability = coaches.docs.map((coach) => {
        const rateData1 = rates1.find((rate) => rate.coach.equals(coach._id));
        const reviewData1 = reviews1.find((review) => review._id.equals(coach._id));
        return({ ...coach,
          hourlyRate: rateData1 ? rateData1.hourlyRate : 0,
          averageRating: reviewData1 ? reviewData1.averageRating : 0,
          totalReviews: reviewData1 ? reviewData1.totalReviews : 0,
          availability: []});
      });

      // Construct the final response
      const response = {
        docs: coachesWithoutAvailability,
        totalDocs: coaches.totalDocs,
        limit: coaches.limit,
        page: coaches.page,
        totalPages: coaches.totalPages,
        pagingCounter: coaches.pagingCounter,
        hasPrevPage: coaches.hasPrevPage,
        hasNextPage: coaches.hasNextPage,
        prevPage: coaches.prevPage,
        nextPage: coaches.nextPage,
      };

      return res.json(ApiResponse(response));
    }

    // Extract coach IDs from the coaches object


    // Get schedule availability for each coach
    const schedules = await Schedule.find({ coach: { $in: coachIds } });

    // Parse the daysToFilter parameter as an array of numbers
    let parsedDaysToFilter = [];
    if (daysToFilter) {
      parsedDaysToFilter = daysToFilter.split(",").map(Number);
    }

    // Filter coaches based on availability on the specified days
    const coachIdsWithAvailability = new Set();
    schedules.forEach((schedule) => {
      const filteredAvailability = schedule.availability.filter((avail) =>
        parsedDaysToFilter.includes(avail.day)
      );
      if (filteredAvailability.length > 0) {
        coachIdsWithAvailability.add(schedule.coach.toString());
        schedule.availability = filteredAvailability;
      } else {
        schedule.availability = []; // Remove the availability if there are no matches
      }
    });

    // Convert Set to an array of coachIds
    const coachIdsArray = [...coachIdsWithAvailability];

    // Filter coaches based on availability
    const coachesWithAvailability = coaches.docs.filter((coach) =>
      coachIdsArray.includes(coach._id.toString())
    );

    // Get rates for each coach
    const rateIds = coachesWithAvailability.map((coach) => coach._id);
    const rates = await Rate.find({ coach: { $in: rateIds } });

    // Get reviews for each coach and calculate averageRating directly in the aggregation pipeline
    const reviews = await Review.aggregate([
      { $match: { coach: { $in: rateIds } } },
      {
        $group: {
          _id: "$coach",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $project: {
          averageRating: {
            $divide: [{ $trunc: { $multiply: ["$averageRating", 2] } }, 2],
          },
          totalReviews: 1,
        },
      },
    ]);

    // Map rates, schedules, and reviews to each coach
    const coachesWithRatesAndAvailability = coachesWithAvailability.map((coach) => {
      const rateData = rates.find((rate) => rate.coach.equals(coach._id));
      const scheduleData = schedules.find((schedule) => schedule.coach.equals(coach._id));
      const reviewData = reviews.find((review) => review._id.equals(coach._id));
      return {
        ...coach,
        hourlyRate: rateData ? rateData.hourlyRate : 0,
        availability: scheduleData ? scheduleData.availability : [],
        averageRating: reviewData ? reviewData.averageRating : 0,
        totalReviews: reviewData ? reviewData.totalReviews : 0,
      };
    });

    // Construct the final response
    const response = {
      docs: coachesWithRatesAndAvailability,
      totalDocs: coaches.totalDocs,
      limit: coaches.limit,
      page: coaches.page,
      totalPages: coaches.totalPages,
      pagingCounter: coaches.pagingCounter,
      hasPrevPage: coaches.hasPrevPage,
      hasNextPage: coaches.hasNextPage,
      prevPage: coaches.prevPage,
      nextPage: coaches.nextPage,
    };

    return res.json(ApiResponse(response));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllTutors = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    from,
    to,
    keyword,
    maxHourlyRate,
    minHourlyRate,
    subjects,
    daysToFilter,
  } = req.query;

  try {
    let finalAggregate = [];

    finalAggregate.push({
      $lookup: {
        from: "rates",
        localField: "_id",
        foreignField: "coach",
        as: "rate",
      },
    });

    finalAggregate.push({
      $match: {
        applicationType: { $in: ["BOTH", "TUTORING"] },
      },
    } ,{
      $match: {
        status:"ACTIVE",
      },
    });

    finalAggregate.push({
      $project: {
        salt: 0,
        hashed_password: 0,
      },
    });

    // Filter by keyword if provided
    if (keyword) {
      finalAggregate.push({
        $match: {
          $or: [
            {
              firstName: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
            {
              lastName: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
            {
              email: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
          ],
        },
      });
    }

    // Filter by status if provided
    if (status) {
      finalAggregate.push({
        $match: {
          status: status,
        },
      });
    }

    // Filter by hourly rate range if provided
    if (maxHourlyRate) {
      finalAggregate.push({
        $match: {
          "rate.hourlyRate": { $lte: parseInt(maxHourlyRate) },
        },
      });
    }

    if (minHourlyRate) {
      finalAggregate.push({
        $match: {
          "rate.hourlyRate": { $gte: parseInt(minHourlyRate) },
        },
      });
    }

    // Filter by subjects if provided
    if (subjects) {
      const subjectArray = subjects.split(",");
      finalAggregate.push({
        $match: {
          subjects: { $in: subjectArray },
        },
      });
    }

    // Get all coaches' data
    const myAggregate =
      finalAggregate.length > 0 ? Coach.aggregate(finalAggregate).sort({ firstName: 1 }) : Coach.aggregate([]);

    const coaches = await Coach.aggregatePaginate(myAggregate, { page, limit });

    if (!coaches) {
      return res.json(ApiResponse({}, "No Tutors found", false));
    }

    const coachIds = coaches.docs.map((coach) => coach._id);
    const rates1 = await Rate.find({ coach: { $in: coachIds } });

    // Get reviews for each coach and calculate averageRating directly in the aggregation pipeline
    const reviews1 = await Review.aggregate([
      { $match: { coach: { $in: coachIds } } },
      {
        $group: {
          _id: "$coach",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $project: {
          averageRating: {
            $divide: [{ $trunc: { $multiply: ["$averageRating", 2] } }, 2],
          },
          totalReviews: 1,
        },
      },
    ]);

    // If daysToFilter is not provided, return all coaches without availability filtering
    if (!daysToFilter) {
      
      const coachesWithoutAvailability = coaches.docs.map((coach) => {
        const rateData1 = rates1.find((rate) => rate.coach.equals(coach._id));
        const reviewData1 = reviews1.find((review) => review._id.equals(coach._id));
        return({ ...coach,
          hourlyRate: rateData1 ? rateData1.hourlyRate : 0,
          averageRating: reviewData1 ? reviewData1.averageRating : 0,
          totalReviews: reviewData1 ? reviewData1.totalReviews : 0,
          availability: []});
      });

      // Construct the final response
      const response = {
        docs: coachesWithoutAvailability,
        totalDocs: coaches.totalDocs,
        limit: coaches.limit,
        page: coaches.page,
        totalPages: coaches.totalPages,
        pagingCounter: coaches.pagingCounter,
        hasPrevPage: coaches.hasPrevPage,
        hasNextPage: coaches.hasNextPage,
        prevPage: coaches.prevPage,
        nextPage: coaches.nextPage,
      };

      return res.json(ApiResponse(response));
    }

    // Extract coach IDs from the coaches object


    // Get schedule availability for each coach
    const schedules = await Schedule.find({ coach: { $in: coachIds } });

    // Parse the daysToFilter parameter as an array of numbers
    let parsedDaysToFilter = [];
    if (daysToFilter) {
      parsedDaysToFilter = daysToFilter.split(",").map(Number);
    }

    // Filter coaches based on availability on the specified days
    const coachIdsWithAvailability = new Set();
    schedules.forEach((schedule) => {
      const filteredAvailability = schedule.availability.filter((avail) =>
        parsedDaysToFilter.includes(avail.day)
      );
      if (filteredAvailability.length > 0) {
        coachIdsWithAvailability.add(schedule.coach.toString());
        schedule.availability = filteredAvailability;
      } else {
        schedule.availability = []; // Remove the availability if there are no matches
      }
    });

    // Convert Set to an array of coachIds
    const coachIdsArray = [...coachIdsWithAvailability];

    // Filter coaches based on availability
    const coachesWithAvailability = coaches.docs.filter((coach) =>
      coachIdsArray.includes(coach._id.toString())
    );

    // Get rates for each coach
    const rateIds = coachesWithAvailability.map((coach) => coach._id);
    const rates = await Rate.find({ coach: { $in: rateIds } });

    // Get reviews for each coach and calculate averageRating directly in the aggregation pipeline
    const reviews = await Review.aggregate([
      { $match: { coach: { $in: rateIds } } },
      {
        $group: {
          _id: "$coach",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $project: {
          averageRating: {
            $divide: [{ $trunc: { $multiply: ["$averageRating", 2] } }, 2],
          },
          totalReviews: 1,
        },
      },
    ]);

    // Map rates, schedules, and reviews to each coach
    const coachesWithRatesAndAvailability = coachesWithAvailability.map((coach) => {
      const rateData = rates.find((rate) => rate.coach.equals(coach._id));
      const scheduleData = schedules.find((schedule) => schedule.coach.equals(coach._id));
      const reviewData = reviews.find((review) => review._id.equals(coach._id));
      return {
        ...coach,
        hourlyRate: rateData ? rateData.hourlyRate : 0,
        availability: scheduleData ? scheduleData.availability : [],
        averageRating: reviewData ? reviewData.averageRating : 0,
        totalReviews: reviewData ? reviewData.totalReviews : 0,
      };
    });

    // Construct the final response
    const response = {
      docs: coachesWithRatesAndAvailability,
      totalDocs: coaches.totalDocs,
      limit: coaches.limit,
      page: coaches.page,
      totalPages: coaches.totalPages,
      pagingCounter: coaches.pagingCounter,
      hasPrevPage: coaches.hasPrevPage,
      hasNextPage: coaches.hasNextPage,
      prevPage: coaches.prevPage,
      nextPage: coaches.nextPage,
    };

    return res.json(ApiResponse(response));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};
exports.getAllTutorAndCoaches = async (req, res) => {
  const { page = 1, limit = 10, status,type, from, to, keyword } = req.query;
  try {
    let finalAggregate = [];

    if (keyword) {
      finalAggregate.push({
        $match: {
          $or: [
            {
              firstName: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
            {
              lastName: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
            {
              email: {
                $regex: ".*" + keyword.toLowerCase() + ".*",
                $options: "i",
              },
            },
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

    if (type) {
      finalAggregate.push({
        $match: {
          applicationType: req.query.type,
        },
      });
    }

    if (from) {
      finalAggregate.push({
        $match: {
          createdAt: {
            $gte: moment(from).startOf("day").toDate(),
            $lte: moment(new Date()).endOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          createdAt: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    finalAggregate.push(
     {
      $project: {
        salt: 0,
        hashed_password: 0,
      },
    });

    const myAggregate =

      finalAggregate.length > 0
        ? Coach.aggregate(finalAggregate).sort({ firstName: 1 })
        : Coach.aggregate([]);

    Coach.aggregatePaginate(myAggregate, { page, limit }, (err, coaches) => {
      if (err) {
        return res.json(
          ApiResponse(
            {},
            errorHandler(err) ? errorHandler(err) : err.message,
            false
          )
        );
      }
      if (!coaches ){
        return res.json(ApiResponse({}, "No tutor / coaches found", false));
      }

      return res.json(ApiResponse(coaches));
    }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//get user by id
exports.getStudentById = async (req, res) => {
  try {
      const user = await User.findById(req.params.id);
      if (!user) {
      return res.json(ApiResponse({}, "No student found", false));
      }
      return res.json(ApiResponse(user));
  } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
  }
  }

  function roundToHalf(num) {
    return Math.round(num * 2) / 2;
  }

  
//get user by id
exports.getCoachById = async (req, res) => {
  try {
      const coach = await Coach.findById(req.params.id);
      let schedule = await Schedule.findOne({coach:req.params.id})
      let rate = await Rate.findOne({coach:req.params.id})

      const aggregate = [
        { $match: { coach: new mongoose.Types.ObjectId(req.params.id) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "services", // The name of the collection you're referencing
            localField: "service", // The field in the Coach model
            foreignField: "_id", // The field in the Service model
            as: "service"
          }
        },
        {
          $project: {
            _id: 0,
            averageRating: 1,
            totalReviews: 1,
          },
        },
      ];
  
      let review = { averageRating: 0, totalReviews: 0 };


      const result = await Review.aggregate(aggregate).exec();

      if(result.length > 0){
        review.averageRating = roundToHalf(result[0]?.averageRating);
        review.totalReviews = result[0].totalReviews
      }

      if (!coach) {
      return res.json(ApiResponse({}, "No coach found", false));
      }
      return res.json(ApiResponse({coach,schedule,rate,review}));
  } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
  }
  }


//update admin
exports.updateStudent = async (req, res) => {
  try {


      if (req.body.image) {
        let currentUser = await User.findById(req.params.id);
        
        if (currentUser.image) {
          const filePath = `./Uploads/${currentUser.image}`;
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`File '${filePath}' deleted.`);
          } else {
            cnsole.log(`File '${filePath}' does not exist.`);
          }o
        }
      }


    let user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) {
      return res.json(ApiResponse({}, "No student found", false));
    }
    return res.json(ApiResponse(user, "Student updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

//toggleStatus
exports.toggleStatus = async (req, res) => {
  try {
    
    let user = await User.findById(req.params.id);

    let coach = await Coach.findById(req.params.id)

    if(user){
      user.status = user.status == "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await user.save();


      const title ="Student Status Changed"
      const content = `A student account has been ${user.status !== "ACTIVE" ? "deactivated" : "activated"}. Name : ${user.firstName + " " + user.lastName}`
      sendNotificationToAdmin(title,content)   

      

      return res.json(ApiResponse(user, "Student Status Changed"));
    }else{
      coach.status = coach.status == "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await coach.save();

      const title ="Coach Status Changed"
      const content = `A coach account has been ${coach.status !== "ACTIVE" ? "deactivated" : "activated"}. Name : ${coach.firstName + " " + coach.lastName}`
      sendNotificationToAdmin(title,content)   

      return res.json(ApiResponse(coach, "Coach Status Changed"));
    }
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//update admin
exports.updateCoach = async (req, res) => {
  try {

      if (req.body.image) {
        let currentCoach = await Coach.findById(req.params.id);
        
        if (currentCoach.image) {
          const filePath = `./Uploads/${currentCoach.image}`;
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`File '${filePath}' deleted.`);
          } else {
            console.log(`File '${filePath}' does not exist.`);
          }
        }
      }


    let coach = await Coach.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!coach) {
      return res.json(ApiResponse({}, "No coach found", false));
    }
    return res.json(ApiResponse(coach, "Coach updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


//get Counts
exports.getCounts = async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ isAdmin: false });
    const tutorCount = await Coach.countDocuments({ });
    const lessonCount = await Lesson.countDocuments();
    const totalEarnings = await Payment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])

    console.log(totalEarnings)
  
    await res
      .status(201)
      .json(ApiResponse({ studentCount,
        tutorCount,
        lessonCount,
        totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].total : 0}, "Dashboard Counts", true));
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
  }
};


exports.getChartData = async (req, res) => {
  try {
    // Calculate the start date for the past 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Aggregate payments for the past 12 months
    const monthlyPayments = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo, $lte: new Date() }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" }
          },
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Create arrays for labels and data
    const labels = [];
    const data = [];

    // Populate arrays with data from the aggregation result
    monthlyPayments.forEach(item => {
      labels.push(item._id);
      data.push(item.total);
    });

    // Send the response
    res.json(ApiResponse({
      labels,
      datasets: [{
        label: "Total Earnings",
        data,
        fill: true,
        backgroundColor: 'rgba(124, 192, 89, 0.4)',
        borderColor: '#7cc059',
        pointRadius: 0,
      }]
    }, "", true));
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findByIdAndRemove(req.params.id);

    if (!student) {
      return res.json(ApiResponse({}, "Student not found", false));
    }

    return res.json(ApiResponse({}, "Student Deleted Successfully", true));
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


exports.getEarningChart = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

    const donationsByMonth = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt',
            },
          },
          amount: { $sum: '$amount'},
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Create a map with months as keys and donations as values
    const donationsMap = new Map();
    donationsByMonth.forEach((entry) => {
      donationsMap.set(entry._id, { amount: entry.amount, count: entry.count });
    });

    // Generate an array with 0 for months without donations
    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth() + 2; // Months are zero-based

    const monthsArray = [];
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const targetMonth = new Date(thisYear, thisMonth - monthOffset - 1, 1);
      const monthKey = targetMonth.toISOString().slice(0, 7);
      const donationEntry = donationsMap.get(monthKey) || { amount: 0, count: 0 };
      monthsArray.push({
        month: monthKey,
        amount: donationEntry.amount,
        count: donationEntry.count,
      });
    }

 return res.json(ApiResponse(monthsArray.reverse(),"",true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getLessonChart = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

    const donationsByMonth = await Lesson.aggregate([
      {
        $match: {
          lessonDate: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$lessonDate',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Create a map with months as keys and donations as values
    const donationsMap = new Map();
    donationsByMonth.forEach((entry) => {
      donationsMap.set(entry._id, { amount: entry.amount, count: entry.count });
    });

    // Generate an array with 0 for months without donations
    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth() + 2; // Months are zero-based

    const monthsArray = [];
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const targetMonth = new Date(thisYear, thisMonth - monthOffset - 1, 1);
      const monthKey = targetMonth.toISOString().slice(0, 7);
      const donationEntry = donationsMap.get(monthKey) || { amount: 0, count: 0 };
      monthsArray.push({
        month: monthKey,
        count: donationEntry.count,
      });
    }

 return res.json(ApiResponse(monthsArray.reverse(),"",true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


exports.getLearnersChart = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);
  
    const usersByMonth = await User.aggregate([
      {
        $match: {
          isAdmin: false,
        },
      },
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
  
    // Create a map with months as keys and user counts as values
    const usersMap = new Map();
    usersByMonth.forEach((entry) => {
      usersMap.set(entry._id, entry.count);
    });
  
    // Generate an array with 0 for months without user registrations
    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth() + 1; // Months are zero-based
  
    const monthsArray = [];
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const targetMonth = new Date(thisYear, thisMonth - monthOffset - 1, 1);
      const monthKey = targetMonth.toISOString().slice(0, 7);
      const userCount = usersMap.get(monthKey) || 0;
      monthsArray.push({
        month: monthKey,
        count: userCount,
      });
    }
  
    monthsArray.reverse(); // Reverse the array
  
    return res.json(ApiResponse(monthsArray, '', true));
  } catch (error) {
    console.error('Error:', error);
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getTutorAndCoachChart = async (req, res) => {
try {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

  const coachesByMonth = await Coach.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m',
            date: '$createdAt',
          },
        },
        tutorCount: {
          $sum: {
            $cond: {
              if: { $or: [
                { $eq: ['$applicationType', 'TUTORING'] },
                { $eq: ['$applicationType', 'BOTH'] },
              ], },
              then: 1,
              else: 0,
            },
          },
        },
        coachCount: {
          $sum: {
            $cond: {
              if: { $or: [
                { $eq: ['$applicationType', 'COACH'] },
                { $eq: ['$applicationType', 'BOTH'] },
              ] },
              then: 1,
              else: 0,
            },
          },
        },
        bothCount: {
          $sum: {
            $cond: {
              if: { $eq: ['$applicationType', 'BOTH'] },
              then: 1,
              else: 0,
            },
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Create a map with months as keys and coach counts as values
  const coachesMap = new Map();
  coachesByMonth.forEach((entry) => {
    coachesMap.set(entry._id, {
      tutorCount: entry.tutorCount,
      coachCount: entry.coachCount,
      bothCount: entry.bothCount,
    });
  });

  // Generate an array with counts for tutors, coaches, and both for months without coach registrations
  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth() + 1; // Months are zero-based

  const monthsArray = [];
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const targetMonth = new Date(thisYear, thisMonth - monthOffset - 1, 1);
    const monthKey = targetMonth.toISOString().slice(0, 7);
    const coachCounts = coachesMap.get(monthKey) || {
      tutorCount: 0,
      coachCount: 0,
      bothCount: 0,
    };
    monthsArray.push({
      month: monthKey,
      tutorCount: coachCounts.tutorCount,
      coachCount: coachCounts.coachCount,
      bothCount: coachCounts.bothCount,
    });
  }

  monthsArray.reverse(); // Reverse the array

  return res.json(ApiResponse(monthsArray, '', true));
} catch (error) {
  console.error('Error:', error);
  return res.json(ApiResponse({}, error.message, false));
}
};


// Delete a tutor
exports.deleteTutor = async (req, res) => {
  try {
    const tutor = await Coach.findByIdAndRemove(req.params.id);

    if (!tutor) {
      return res.json(ApiResponse({}, "Tutor / Coach not found", false));
    }

    return res.json(ApiResponse({}, "Tutor / Coach Deleted Successfully", true));
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



