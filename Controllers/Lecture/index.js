//Models
const Lecture = require("../../Models/Lecture");
const Course = require("../../Models/Course");
const moment = require("moment");
var ffmpeg = require('fluent-ffmpeg');
const fs = require('fs')
const path = require("path")
//Helpers
const {createVideoFrame,getVideoDuration} = require("../../Helpers/videoFrame")
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { sendNotificationToAdmin } = require("../../Helpers/notification");
const mongoose = require("mongoose");



exports.addLecture = async (req, res) => {
  const {lectureNo,title, description,course } = req.body;
   let {video} = req.files

  try {
    const existingLecture = await Lecture.findOne({ title });

    if(existingLecture){
      return res.json(ApiResponse({}, "Lecture with this title already exists", false));
    }

    const existingCourse = await Course.findById(course)

    if(!existingCourse){
      return res.json(ApiResponse({}, "Course Not Found", false));
    }

    const image = createVideoFrame(video[0].path)
    let duration = await  getVideoDuration(video[0].path);

    const lecture = new Lecture({
      lectureNo,
      title,
      description,
      course,
      duration,
      fileUrl:video[0].filename,
      image,
    })

    await lecture.save();

    const title2 = "New Lecture Created";
    const content2 = `A new lecture has been created.Lecture No : ${lectureNo}`;
    sendNotificationToAdmin(title2, content2);

    return res
    .status(200)
    .json(ApiResponse({ lecture }, "Lecture Created Successfully", true));

  } catch (error) {

    console.log(error)
    return res.json(
      ApiResponse(
        {},
        errorHandler(error) ? errorHandler(error) : error.message,
        false
      )
    );
  }
};

exports.getAllLectures = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status } = req.query;

    let finalAggregate = [
      {
        $sort: {
          title: 1,
        },
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
          from: "categories",
          localField: "course.category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
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
          createdAt: {
            $gte: moment(from).startOf("day").toDate(),
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

    const myAggregate =
      finalAggregate.length > 0
        ? Lecture.aggregate(finalAggregate)
        : Lecture.aggregate([]);

    Lecture.aggregatePaginate(myAggregate, { page, limit }).then(
      (lectures) => {
        res.json(ApiResponse(lectures));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


exports.getAllLecturesByCourse = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status } = req.query;
    let {course} = req.params;

    let finalAggregate = [
      {
        $match: {
          course:new mongoose.Types.ObjectId(course)
        }
      },
      {
        $sort: {
          title: 1,
        },
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
          createdAt: {
            $gte: moment(from).startOf("day").toDate(),
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

    const myAggregate =
      finalAggregate.length > 0
        ? Lecture.aggregate(finalAggregate)
        : Lecture.aggregate([]);

    Lecture.aggregatePaginate(myAggregate, { page, limit }).then(
      (lectures) => {
        res.json(ApiResponse(lectures));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


// Get lesson by ID
exports.getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id).populate("course");

    if (!lecture) {
      return res.json(ApiResponse({}, "Lecture not found", true));
    }

    return res.json(ApiResponse({ lecture }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get lesson by ID
exports.updateLecture = async (req, res) => {
  try {
    let {video} = req.files
    let data = {...req.body}
    let oldLecture = await Lecture.findById(req.params.id)

    if(video){
      const image = createVideoFrame(video[0].path)
      let duration = await  getVideoDuration(video[0].path);
      data.image = image;
      data.duration = duration;
      data.fileUrl = video[0].filename;

      console.log(oldLecture)

      if(oldLecture?.image){
        const imagePath = path.join('./Uploads', oldLecture?.image);

        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }

      }

      if(oldLecture?.fileUrl){
        const videoPath = path.join('./Uploads', oldLecture?.fileUrl);

        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }

      }

      // const videoPath = path.join('./Uploads', oldLecture?.fileUrl);


      // console.log(oldLecture.fileUrl)

// 
      // if (fs.existsSync(imagePath)) {
          // fs.unlinkSync(imagePath);
        // }
        // if (fs.existsSync(videoPath)) {
          // fs.unlinkSync(videoPath);
        // }
  }

    
    let lecture = await Lecture.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    if (!lecture) {
      return res.json(ApiResponse({}, "No lecture found", false));
    }

    return res.json(ApiResponse(lecture, "Lecture updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete a lesson
exports.deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndRemove(req.params.id);

    if (!lecture) {
      return res.json(ApiResponse({}, "Lecture not found", false));
    }

    if (lecture.image) {
      const filePath = `./Uploads/${lecture.image}`;
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File '${filePath}' deleted.`);
      } else {
        console.log(`File '${filePath}' does not exist.`);
      }
    }

    if (lecture.fileUrl) {
      const filePath2 = `./Uploads/${lecture.fileUrl}`;
      
      if (fs.existsSync(filePath2)) {
        fs.unlinkSync(filePath2);
        console.log(`File '${filePath2}' deleted.`);
      } else {
        console.log(`File '${filePath2}' does not exist.`);
      }
    }

    return res.json(ApiResponse({}, "Lecture Deleted Successfully", true));
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
