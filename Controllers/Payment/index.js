//Models
const User = require("../../Models/User");
const Coach = require("../../Models/Teacher");
const Lesson = require("../../Models/Lesson");
const Payment = require("../../Models/Payment");
const Course = require("../../Models/Course")
const fs = require("fs");
const stripe = require("stripe")("sk_test_51KHXNgEhqLqdrjwEAPRFFUURiEyMLWajMbOewSENFMkTwoY4dVBpfmQPLpX0AdFgvGky6fUn99RtETYfSVdfcwuP00IqdyPIxL");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { sendNotificationToAdmin,sendNotificationToUser } = require("../../Helpers/notification");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");
const mongoose = require("mongoose");

exports.lessonPayment = async (req, res) => {
  try {
    const { lesson,stripeToken} = req.body;

    const existingLesson = await Lesson.findById(lesson);

    if (!existingLesson) {
      return res.json(ApiResponse({}, "Lesson not Found", false));
    }

    const existingPayment = await Payment.findOne({
      lesson: req.body.lesson,
      payee: req.user._id,
    });

    if (existingPayment) {
      return res.json(ApiResponse({}, "Payment Already made", false));
    }



  charge = await stripe.charges.create({
    amount: existingLesson.charges * 100,
    description: "The Birchwood Academy ",
    currency: "usd",
    source: stripeToken.id,
  });

  let paymentLog = new Payment({
    amount:  existingLesson.charges,
    chargeId: charge.id ? charge.id : null,
    lesson:lesson,
    payee: req.user._id ? req.user._id : null,
    type: "LESSON",
  });


  await paymentLog.save();
  


  existingLesson.isPaid = true;
  await existingLesson.save();

  const title ="Lesson Payment Made"
  const content = `A student has made a lesson payment. Lesson Id : ${existingLesson.lessonId}.`
  sendNotificationToAdmin(title,content)   


  const title2 ="Lesson Payment Successful"
  const content2 = `You have sucessfully made a new lesson payment. Lesson Id : ${existingLesson.lessonId}.`
  sendNotificationToUser(existingLesson.student,title2,content2)   

  const title3 ="Lesson Payment Made"
  const content3 = `Student had made payment for your lesson. Lesson Id : ${existingLesson.lessonId}.`
  sendNotificationToUser(existingLesson.coach,title3,content3)   


  return res.json(ApiResponse({},"Payment Successfully Paid", true));
  } catch (error) {
    return res.json(
      ApiResponse(
        {},
         error.message ?  error.message : errorHandler(error) ,
        false
      )
    );
  }
};

exports.coursePayment = async (req, res) => {
  try {
    const { course,stripeToken} = req.body;

    const existingCourse = await Course.findById(course);
    const existingStudent = await User.findById(req.user._id);

    if (!existingCourse) {
      return res.json(ApiResponse({}, "Course not Found", false));
    }

    const existingPayment = await Payment.findOne({
      course: req.body.course,
      payee: req.user._id,
    });

    if (existingPayment || existingStudent.courses.includes(req.body.course)) {
      return res.json(ApiResponse({}, "Course Already Purchased", false));
    }





  charge = await stripe.charges.create({
    amount: existingCourse.price * 100,
    description: "The Birchwood Academy ",
    currency: "usd",
    source: stripeToken.id,
  });

  let paymentLog = new Payment({
    amount:  existingCourse.price,
    chargeId: charge.id ? charge.id : null,
    course:course,
    payee: req.user._id ? req.user._id : null,
    type: "COURSE",
  });


  await paymentLog.save();
  

  if (!existingStudent.courses.includes(req.body.course)) {
    existingStudent.courses.push(req.body.course);
    await existingStudent.save();
  }


  const title ="Course Payment Made"
  const content = `A student has made a Course payment. Course Id : ${existingCourse._id}.`
  sendNotificationToAdmin(title,content)   


  const title2 ="Course Payment Successful"
  const content2 = `You have sucessfully made a new course payment. Course Id : ${existingCourse._id}.`
  sendNotificationToUser(req.user._id,title2,content2)   


  return res.json(ApiResponse({},"Payment Successfully Paid", true));
  } catch (error) {
    return res.json(
      ApiResponse(
        {},
         error.message ?  error.message : errorHandler(error) ,
        false
      )
    );
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;



    let finalAggregate = [
      {
        $lookup: {
          from: "users",
          localField: "payee",
          foreignField: "_id",
          as: "payee",
        },
      },
      {
        $unwind: "$payee",
      },
      {
        $lookup: {
          from: "lessons",
          localField: "lesson",
          foreignField: "_id",
          as: "lesson",
        },
      },
      {
        $unwind: {
          path: "$lesson",
          preserveNullAndEmptyArrays: true, // Handle missing "lesson" field
        },
      },
      {
        $lookup: {
          from: "coaches",
          localField: "lesson.coach",
          foreignField: "_id",
          as: "lesson.coach",
        },
      },
      {
        $unwind: {
          path: "$lesson.coach",
          preserveNullAndEmptyArrays: true, // Handle missing "lesson.coach" field
        },
      },
    ];




    if (req.query.from) {
      finalAggregate.push({
        $match: {
          createdAt: {
            $gte: moment(req.query.from).startOf("day").toDate(),
          },
        },
      });
    }

    if (req.query.to) {
      finalAggregate.push({
        $match: {
          createdAt: {
            $lte: moment(req.query.to).endOf("day").toDate(),
          },
        },
      });
    }


    const myAggregate =
      finalAggregate.length > 0
        ? Payment.aggregate(finalAggregate)
        : Payment.aggregate([]);

    Payment.aggregatePaginate(myAggregate, { page, limit }).then((payments) => {
      res.json(ApiResponse(payments));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


exports.createCharge = async (req, res) => {
    const { paymentMethodId } = req.body;
    const amount = 1000; // Set the amount as required
  
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            payment_method: paymentMethodId,
            confirm: true,
            transfer_group: "TRANSFER_GROUP_1"
          });

          console.log(paymentIntent)
      
        //   // Retrieve the charge ID from the payment intent
        //   const chargeId = paymentIntent.charges.data[0].id;
  
      // Create a transfer
    //   const transfer = await stripe.transfers.create({
    //     amount:20,
    //     currency: "usd",
    //     destination: "acct_1NPmhxIMDgmkSTwO", // Replace with the destination account ID
    //     transfer_group: "TRANSFER_GROUP_1", // Replace with your transfer group ID
    //   });
  
      // Handle the success response
      res.sendStatus(200);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.sendStatus(500);
    }
  }
    
