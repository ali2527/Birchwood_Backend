// Models
const Review = require("../../Models/Review");
const Coach = require("../../Models/Teacher")
const Lesson = require("../../Models/Lesson")

// Helpers
const { ApiResponse } = require("../../Helpers/index");
const {errorHandler} = require("../../Helpers/errorHandler")
const {sendNotificationToAdmin,sendNotificationToUser} = require("../../Helpers/notification")

//mongoose
const mongoose = require("mongoose");
const User = require("../../Models/User");

function roundToHalf(num) {
  return Math.round(num * 2) / 2;
}


// Add a review
exports.addReview = async (req, res) => {
  const {coach,lesson, rating, comment } = req.body;
  const student = req.user._id; 

  try {
 
    let currentCoach = await Coach.findById(coach)
    let currentStudent = await User.findById(student)
    let currentlesson = await Lesson.findById(lesson)


    if(!currentCoach){
        return res.status(200).json(
            ApiResponse(
              { },
              "Coach not found",
              false
            )
          );
    }

    let review = await Review.findOne({lesson,coach})

    if(review){
      return res.status(200).json(
        ApiResponse(
          { },
          "Coach lesson already reviewed",
          false
        )
      );
    }

    review = new Review({
      student,
      coach,
      lesson,
      rating,
      comment,
    });


    

    await review.save();

    currentlesson.isReviewed = true;

    await currentlesson.save();



    const title ="New Review Added"
    const content = `A student has added a lesson review. Student : ${currentStudent.firstName + " " + currentStudent.lastName}. Coach : ${currentCoach.firstName + " " + currentCoach.lastName}`
    sendNotificationToAdmin(title,content)    

    const title3 ="New Review on your lesson"
    const content3 = `${currentStudent.firstName + " " + currentStudent.lastName} has reviewed your lesson`
    sendNotificationToUser(currentCoach._id,title3,content3)  


    return res.status(200).json(
      ApiResponse(
        { review },
        
        "Review Created Successfully",
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

// Get all reviews by coach ID
// exports.getAllReviewsByCoachId = async (req, res) => {
//   try {
//     const page = req.query.page || 1;
//     const limit = req.query.limit || 10;
//     const star = req.query.star || null;

//     const finalAggregate = [
//       { $match: { coach: new mongoose.Types.ObjectId(req.params.coachId) } }, 
//     ];

//     if (star) {
//         finalAggregate.push({
//         $match: { rating: parseInt(star) } // Match reviews with the specified rating (star)
//       });
//     }

//     finalAggregate.push({
//       $lookup: {
//         from: "users",
//         localField: "student",
//         foreignField: "_id",
//         as: "student",
//       },
//     },{
//       $unwind: "$student",
//     })


//     const myAggregate = 
//     finalAggregate.length > 0
//       ? Review.aggregate(finalAggregate)
//       : Review.aggregate([]);

//   Review.aggregatePaginate(myAggregate, { page, limit }).then(
//     (reviews) => {
//       const response = {
//         reviews: reviews.docs,
//         totalPages: reviews.totalPages,
//         totalReviews: reviews.totalDocs,
//         ratings: {
//           "5": 0,
//           "4": 0,
//           "3": 0,
//           "2": 0,
//           "1": 0,
//         },
//       };

//       reviews.docs.forEach((review) => {
//         response.ratings[review.rating.toString()] += 1;
//       });

//       // Calculate percentages
//       for (const rating in response.ratings) {
//         const count = response.ratings[rating];
//         response.ratings[rating] = response.totalReviews > 0 ? Math.round((count / response.totalReviews) * 100) : 0;
//       }

//       res.json(ApiResponse(response));
//     }
//   );
//   } catch (error) {
//     return res.json(ApiResponse({}, error.message, false));
//   }
// };

exports.getAllReviewsByCoachId = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const star = req.query.star || null;

    const finalAggregate = [
      { $match: { coach: new mongoose.Types.ObjectId(req.params.coachId) } },
    ];

    if (star) {
      finalAggregate.push({
        $match: { rating: parseInt(star) } // Match reviews with the specified rating (star)
      });
    }

    finalAggregate.push({
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "student",
      },
    }, {
      $unwind: "$student",
    },
    {
      $lookup: {
        from: "lessons",
        localField: "lesson",
        foreignField: "_id",
        as: "lesson",
      },
    }, {
      $unwind: "$lesson",
    });

    const myAggregate =
      finalAggregate.length > 0
        ? Review.aggregate(finalAggregate)
        : Review.aggregate([]);

    const allReviews = await myAggregate.exec();

    const response = {
      reviews: allReviews.slice((page - 1) * limit, page * limit),
      totalPages: Math.ceil(allReviews.length / limit),
      page:parseInt(page),
      limit:parseInt(limit),
      totalReviews: allReviews.length,
      ratings: {
        "5": 0,
        "4": 0,
        "3": 0,
        "2": 0,
        "1": 0,
      },
    };

    allReviews.forEach((review) => {
      response.ratings[review.rating.toString()] += 1;
    });

    // Calculate percentages
    for (const rating in response.ratings) {
      const count = response.ratings[rating];
      response.ratings[rating] = response.totalReviews > 0 ? Math.round((count / response.totalReviews) * 100) : 0;
    }

    res.json(ApiResponse(response));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getCoachRatings = async (req, res) => {
  try {
    const coachId = req.params.coachId;

    const aggregate = [
      { $match: { coach: new mongoose.Types.ObjectId(coachId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          averageRating: 1,
          totalReviews: 1,
        },
      },
    ];

    const result = await Review.aggregate(aggregate).exec();

    if (result.length === 0) {
      // If there are no reviews for the coach
      return res.json(ApiResponse({}, "No reviews found for the coach.", false));
    }
    const roundedRating = roundToHalf(result[0].averageRating);
    result[0].averageRating = roundedRating;

    res.json(ApiResponse(result[0]));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


// Get review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.json(ApiResponse({}, "Review not found", true));
    }

    return res.json(ApiResponse({ review }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndRemove(req.params.id);

    if (!review) {
      return res.json(ApiResponse({}, "Review not found", false));
    }

    return res.json(ApiResponse({}, "Review Deleted Successfully", true));
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