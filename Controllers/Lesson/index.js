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
const { sendNotificationToAdmin,sendNotificationToUser } = require("../../Helpers/notification");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");
const mongoose = require("mongoose");

exports.addLesson = async (req, res) => {
  const { subject, lessonType, lessonDate, slots, studentId, coachId } =
    req.body;
  try {
    // Check if the student exists
    const existingStudent = await User.findById(studentId);
    if (!existingStudent) {
      return res.json(ApiResponse({}, "Student not found", false));
    }

    // Check if the coach exists
    const existingCoach = await Coach.findById(coachId);
    if (!existingCoach) {
      return res.json(ApiResponse({}, "Coach not found", false));
    }

    const lessonDateObj = new Date(lessonDate);
    const newSlots = slots.map((slot) => ({
      lessonStartTime: new Date(slot.lessonStartTime),
      lessonEndTime: new Date(slot.lessonEndTime),
    }));

    // Check if any lessons exist with the same lessonDate
    const existingLessonsOnDate = await Lesson.find({
      lessonDate: {
        $gte: new Date(lessonDateObj.getFullYear(), lessonDateObj.getMonth(), lessonDateObj.getDate()), // Start of the selected date
        $lt: new Date(lessonDateObj.getFullYear(), lessonDateObj.getMonth(), lessonDateObj.getDate() + 1), // End of the selected date (midnight of the next day)
      },
    });

    console.log(lessonDateObj)

    // Check for overlapping start times with existing lessons
    for (const existingLesson of existingLessonsOnDate) {
      for (const existingSlot of existingLesson.slots) {
        for (const newSlot of newSlots) {
          if (
            newSlot.lessonStartTime.getTime() ===
            existingSlot.lessonStartTime.getTime()
          ) {
            return res.json(
              ApiResponse(
                {},
                "Lesson slot already booked. Please choose a different Date / Slot",
                false
              )
            );
          }
        }
      }
    }


    // return;
    // Calculate the number of lessons based on the slots length
    const noOfLesson = slots.length;

    // Find the rates for the coach and lesson type\
    const rates = await Rates.findOne({ coach: existingCoach });

    if (!rates) {
      return res.json(ApiResponse({}, "Rates not found for the coach", false));
    }

    console.log(rates);

    //   calculating Comisssion
    const commission = await Commission.findOne();

    const tutoringCommissionAmount =
      (rates.tutoringRate * (commission?.tutoringCommission || 0)) / 100;
    const coachingCommissionAmount =
      (rates.coachingRate * (commission?.coachingCommission || 0)) / 100;

    const totalTutoringRate = Math.floor(
      rates.tutoringRate + tutoringCommissionAmount
    );
    const totalCoachingRate = Math.floor(
      rates.coachingRate + coachingCommissionAmount
    );

    let charge =
      lessonType == "TUTORING" ? totalTutoringRate : totalCoachingRate;

    console.log(tutoringCommissionAmount);
    console.log(coachingCommissionAmount);
    // Calculate the total cost of the lessons
    const totalCost = Math.floor(noOfLesson * charge);

    // Save the lesson
    const lesson = new Lesson({
      subject,
      lessonType,
      lessonDate,
      slots,
      student: existingStudent,
      coach: existingCoach,
      noOfLesson,
      charges: totalCost,
    });

    await lesson.save();

    const title ="New Lesson Created"
    const content = `A new lesson has been created. Student : ${existingStudent.firstName + " " + existingStudent.lastName}. Coach : ${existingCoach.firstName + " " + existingCoach.lastName}`
    sendNotificationToAdmin(title,content)   


    const title2 ="New Lesson Booked"
    const content2 = `You have booked a new lesson with ${existingCoach.firstName + " " + existingCoach.lastName}. the lesson is pending approval from Coach`
    sendNotificationToUser(existingStudent._id,title2,content2)   

    const title3 ="New Lesson Booked"
    const content3 = `${existingStudent.firstName + " " + existingStudent.lastName} has booked a new lesson with you. Review the lesson to approve the request`
    sendNotificationToUser(existingCoach._id,title3,content3)   


    if (!existingStudent.coaches.includes(existingCoach._id)) {
      existingStudent.coaches.push(existingCoach._id);
      await existingStudent.save();
    }

    // Update student in coach table if not already present
    if (!existingCoach.students.includes(existingStudent._id)) {
      existingCoach.students.push(existingStudent._id);
      await existingCoach.save();
    }

    return res
      .status(200)
      .json(ApiResponse({ lesson }, "Lesson Created Successfully", true));
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

exports.getAllLessons = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let user = await User.exists({ _id: req.user.id });
    let coach = await Coach.exists({ _id: req.user.id });

    let finalAggregate = [{
      $sort:{
        createdAt:-1
      }
    }];


    if (user) {
      finalAggregate.push(
        {
          $match: {
            student: new mongoose.Types.ObjectId(req.user._id),
          },
        },
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
        }
      );
    } else if (coach) {
      finalAggregate.push(
        {
          $match: {
            coach: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
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
    }

    if (req.query.status) {
      finalAggregate.push({
        $match: {
          status: req.query.status,
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

exports.getAllPendingLessons = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let user = await User.exists({ _id: req.user.id });
    let coach = await Coach.exists({ _id: req.user.id });

    let finalAggregate = [{
      $sort:{
        createdAt:-1
      }
    }];


    if (user) {
      finalAggregate.push(
        {
          $match: {
            student: new mongoose.Types.ObjectId(req.user._id),
          },
        },
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
        }
      );
    } else if (coach) {
      finalAggregate.push(
        {
          $match: {
            coach: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
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
    }

    finalAggregate.push({
      $match: {
        status: "PENDING",
      },
    },{
      $lookup: {
        from: "coaches",
        localField: "coach",
        foreignField: "_id",
        as: "coach",
      },
    },
    {
      $unwind: "$coach",
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

    let user = await User.exists({ _id: req.user.id });
    let coach = await Coach.exists({ _id: req.user.id });

    let finalAggregate = [{
      $sort:{
        createdAt:-1
      }
    }];


    if (user) {
      finalAggregate.push(
        {
          $match: {
            student: new mongoose.Types.ObjectId(req.user._id),
          },
        },
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
        }
      );
    } else if (coach) {
      finalAggregate.push(
        {
          $match: {
            coach: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
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
    }

   
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

    if (status) {
      finalAggregate.push({
        $match: {
          status: req.query.status,
        },
      });
    }else{
      finalAggregate.push({
        $match: {
          status: { $in: ["UPCOMING", "PENDING"] },
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

    if (from || to) {
      const dateRangeFilter = {};
    
      if (from) {
        dateRangeFilter.$gte = moment(from).startOf("day").toDate();
      }
    
      if (to) {
        dateRangeFilter.$lte = moment(to).endOf("day").toDate();
      }
    
      finalAggregate.push({
        $match: {
          lessonDate: dateRangeFilter,
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

    let user = await User.exists({ _id: req.user.id });
    let coach = await Coach.exists({ _id: req.user.id });

    let finalAggregate = [{
      $sort:{
        createdAt:-1
      }
    }];

    if (user) {
      finalAggregate.push(
        {
          $match: {
            student: new mongoose.Types.ObjectId(req.user._id),
          },
        },
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
        }
      );
    } else if (coach) {
      finalAggregate.push(
        {
          $match: {
            coach: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
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
    }

   
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

    if (status) {
      finalAggregate.push({
        $match: {
          status: req.query.status,
        },
      });
    }else{
      finalAggregate.push({
        $match: {
          status: "LIVE",
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


    
    if (from || to) {
      const dateRangeFilter = {};
    
      if (from) {
        dateRangeFilter.$gte = moment(from).startOf("day").toDate();
      }
    
      if (to) {
        dateRangeFilter.$lte = moment(to).endOf("day").toDate();
      }
    
      finalAggregate.push({
        $match: {
          lessonDate: dateRangeFilter,
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

    let user = await User.exists({ _id: req.user.id });
    let coach = await Coach.exists({ _id: req.user.id });

    let finalAggregate = [{
      $sort:{
        createdAt:-1
      }
    }];


    if (user) {
      finalAggregate.push(
        {
          $match: {
            student: new mongoose.Types.ObjectId(req.user._id),
          },
        },
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
        }
      );
    } else if (coach) {
      finalAggregate.push(
        {
          $match: {
            coach: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
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
    }

   
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

    if (status) {
      finalAggregate.push({
        $match: {
          status: req.query.status,
        },
      });
    }else{
      finalAggregate.push({
        $match: {
          status: "COMPLETED",
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

    if (from || to) {
      const dateRangeFilter = {};
    
      if (from) {
        dateRangeFilter.$gte = moment(from).startOf("day").toDate();
      }
    
      if (to) {
        dateRangeFilter.$lte = moment(to).endOf("day").toDate();
      }
    
      finalAggregate.push({
        $match: {
          lessonDate: dateRangeFilter,
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

    let user = await User.exists({ _id: req.user.id });
    let coach = await Coach.exists({ _id: req.user.id });

    let finalAggregate = [{
      $sort:{
        createdAt:-1
      }
    }];

    if (user) {
      finalAggregate.push(
        {
          $match: {
            student: new mongoose.Types.ObjectId(req.user._id),
          },
        },
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
        }
      );
    } else if (coach) {
      finalAggregate.push(
        {
          $match: {
            coach: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
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
    }

    finalAggregate.push({
      $match: {
        status: "REJECTED",
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

exports.getAllMissedLessons = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let user = await User.exists({ _id: req.user.id });
    let coach = await Coach.exists({ _id: req.user.id });

    let finalAggregate = [{
      $sort:{
        createdAt:-1
      }
    }];

    if (user) {
      finalAggregate.push(
        {
          $match: {
            student: new mongoose.Types.ObjectId(req.user._id),
          },
        },
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
        }
      );
    } else if (coach) {
      finalAggregate.push(
        {
          $match: {
            coach: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
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
    }

    finalAggregate.push({
      $match: {
        status: "MISSED",
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

// Get lesson by ID
exports.updateLesson = async (req, res) => {

  try {
    let lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });


    if (!lesson) {
      return res.json(ApiResponse({}, "No lesson found", false));
    }

    if(req.body.status && req.body.status == "UPCOMING"){
      const title ="Lesson Approved"
    const content = `A coach has approved a Lesson. lesson : ${lesson.lessonId}.`
    sendNotificationToAdmin(title,content)   


    const title2 ="Lesson Approved"
    const content2 = `Coach has approved your lesson please return to lesson page to make payment. lesson : ${lesson.lessonId}.`
    sendNotificationToUser(lesson.student,title2,content2)   
    }
    

    if(req.body.status && req.body.status == "LIVE"){
      const title ="Lesson Started"
    const content = `A coach has started a Lesson. lesson : ${lesson.lessonId}.`
    sendNotificationToAdmin(title,content)   


    const title2 ="Lesson Started"
    const content2 = `Coach has statred your lesson please return to lesson page to join meeting. lesson : ${lesson.lessonId}.`
    sendNotificationToUser(lesson.student,title2,content2)   
    }


    if(req.body.status && req.body.status == "COMPLETED"){
      const title ="Lesson COMPLETED"
    const content = `A coach has completed a Lesson. lesson : ${lesson.lessonId}.`
    sendNotificationToAdmin(title,content)   


    const title2 ="Lesson Started"
    const content2 = `Coach has statred your completed please return to lesson page review Coach. lesson : ${lesson.lessonId}.`
    sendNotificationToUser(lesson.student,title2,content2)   
    }


    if(req.body.status == "COMPLETED"){
      let existingLesson = Lesson.findOne({student:lesson.student,status: { $nin:  ['COMPLETED', 'MISSED','REJECTED'] }})
      

     if(!existingLesson){ const studentUser = await User.findById(lesson.student);

      if (studentUser) {
        // Remove the lesson ID from the coaches array in the user's schema
        studentUser.coaches = studentUser.coaches.filter(coachId => coachId.toString() !== lesson.coach.toString());
        await studentUser.save();
      }

      // Find the coach by ID
      const coach = await Coach.findById(lesson.coach);

      if (coach) {
        // Remove the student ID from the students array in the coach's schema
        coach.students = coach.students.filter(studentId => studentId.toString() !== lesson.student.toString());
        await coach.save();
      }}


      
    }


    


    return res.json(ApiResponse(lesson, "lesson updated successfully"));
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


exports.createLessonSignature = async (req, res) => {
  try {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2

    const oHeader = { alg: 'HS256', typ: 'JWT' }


    const oPayload = {
      sdkKey: process.env.ZOOM_SDK,
      mn: req.body.meetingNumber,
      role: 1,
      iat: iat,
      exp: exp,
    }
  
    const sHeader = JSON.stringify(oHeader)
    const sPayload = JSON.stringify(oPayload)
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_SECRET) 


    res.json({
      signature: signature,
      sdkKey:process.env.ZOOM_SDK
    })
    
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