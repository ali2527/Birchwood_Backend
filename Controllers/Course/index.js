//Models
const Course = require("../../Models/Course");
const User = require("../../Models/User");
const Category = require("../../Models/Category")
const moment = require("moment");
const fs = require("fs")
//Helpers
const {createVideoFrame,getVideoDuration} = require("../../Helpers/videoFrame")
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { sendNotificationToAdmin } = require("../../Helpers/notification");
const mongoose = require("mongoose");



exports.addCourse = async (req, res) => {
  const {courseCode,title, description,image,category,duration,price,startDate,features } = req.body;
  
  try {
    const existingCourse = await Course.findOne({ $or: [
      { title },
      { courseCode } 
    ] });

    if(existingCourse){
      return res.json(ApiResponse({}, "Duplicate CourseCode or title", false));
    }

    const existingCategory = await Category.findById(category)

    if(!existingCategory){
      return res.json(ApiResponse({}, "Category Not Found", false));
    }

    const course = new Course({
      courseCode,title, description,image,duration,category,price,startDate,features,author:req.user._id
    })

    await course.save();

    const title2 = "New Course Created";
    const content2 = `A new course has been created.Course Title : ${title}`;
    sendNotificationToAdmin(title2, content2);

    return res
    .status(200)
    .json(ApiResponse({ course }, "Course Created Successfully", true));
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

exports.getAllCourses = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status,category } = req.query;

    let finalAggregate = [
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
          startDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          startDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }

    if (category) {
      finalAggregate.push({
        $match: {
          category: new mongoose.Types.ObjectId(req.query.category),
        },
      });
    }

    
    finalAggregate.push(     {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    })


    console.log(finalAggregate)
    const myAggregate =
      finalAggregate.length > 0
        ? Course.aggregate(finalAggregate)
        : Course.aggregate([]);

    Course.aggregatePaginate(myAggregate, { page, limit }).then(
      (courses) => {
        res.json(ApiResponse(courses));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllCoachCourses = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status } = req.query;

    let finalAggregate = [
      {
        $match: {
          author: new mongoose.Types.ObjectId(req.params.id),
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
          startDate: {
            $gte: moment(from).startOf("day").toDate(),
          },
        },
      });
    }

    if (to) {
      finalAggregate.push({
        $match: {
          startDate: {
            $lte: moment(to).endOf("day").toDate(),
          },
        },
      });
    }
   
    finalAggregate.push(     {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    })


    console.log(finalAggregate)
    const myAggregate =
      finalAggregate.length > 0
        ? Course.aggregate(finalAggregate)
        : Course.aggregate([]);

    Course.aggregatePaginate(myAggregate, { page, limit }).then(
      (courses) => {
        res.json(ApiResponse(courses));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getMyCourses = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    // Find the student with the given req.user._id
    const student = await User.findById(req.user._id);

    if (!student) {
      return res.status(404).json(ApiResponse({}, 'Student not found', false));
    }

    // Get the coach IDs associated with the student
    const courseIds = student.courses;

    // Count the total number of documents matching the query
    const totalDocs = await Course.countDocuments({ _id: { $in: courseIds } });

    // Calculate total pages based on the limit
    const totalPages = Math.ceil(totalDocs / parseInt(limit));

    // Find the courses based on their IDs with pagination
    const courses = await Course.find({ _id: { $in: courseIds } })
      .populate('category')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const response = {
      courses,
      pageInfo: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalDocs,
        totalPages,
      },
    };

    return res.status(200).json(ApiResponse(response, 'Courses retrieved successfully', true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};


exports.getAllCourseByCategory = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status } = req.query;

    let {category} = req.params;

    let finalAggregate = [{
      $match: {
        category:new mongoose.Types.ObjectId(category)
      }
    },
      {
        $lookup: {
          from: "categories",
          localField: "category",
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
        ? Course.aggregate(finalAggregate)
        : Course.aggregate([]);

    Course.aggregatePaginate(myAggregate, { page, limit }).then(
      (courses) => {
        res.json(ApiResponse(courses));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("category");

    if (!course) {
      return res.json(ApiResponse({}, "Course not found", true));
    }

    return res.json(ApiResponse({ course }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get course by ID
exports.updateCourse = async (req, res) => {
  try {

    if (req.body.image) {
      let currentCourse = await Course.findById(req.params.id);
      
      if (currentCourse.image) {
        const filePath = `./Uploads/${currentCourse.image}`;
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`File '${filePath}' deleted.`);
        } else {
          console.log(`File '${filePath}' does not exist.`);
        }
      }
    }


    let course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!course) {
      return res.json(ApiResponse({}, "No course found", false));
    }

    return res.json(ApiResponse(course, "Course updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndRemove(req.params.id);

    if (!course) {
      return res.json(ApiResponse({}, "Course not found", false));
    }

    if (course.image) {
      const filePath = `./Uploads/${course.image}`;
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File '${filePath}' deleted.`);
      } else {
        console.log(`File '${filePath}' does not exist.`);
      }
    }

    return res.json(ApiResponse({}, "Course Deleted Successfully", true));
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
