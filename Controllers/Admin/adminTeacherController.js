//Models
const Teacher = require("../../Models/Teacher");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const {generateRandom6DigitID} = require("../../Helpers")
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const {sendNotificationToUser, sendNotificationToAdmin} = require("../../Helpers/notification")
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");


//signup
exports.addTeacher = async (req, res) => {
  // return;
  const {email,teacherId} = req.body;
  try {
    let teacher = await Teacher.findOne({
        $or: [
          { email },
          { teacherId }
        ]
      });
    if (teacher) {
      return res
        .status(400)
        .json(ApiResponse({}, "Teacher with this email / Teacher ID already exist", false));
    }

    teacher = new Teacher({
      ...req.body,
    });

    await teacher.save();

    const title ="New Teacher Added"
    const content = `A new teacher has been added on the app. Email : ${email}`
    sendNotificationToAdmin(title,content)   

    return res
      .status(200)
      .json(ApiResponse({ teacher }, "Teacher Added Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

//get all teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    let { keyword, from, to, status } = req.query;

    let finalAggregate = [
      {
        $sort: {
          createdAt: 1,
        },
      },
    ];

    if (keyword) {
      const regex = new RegExp(keyword.toLowerCase(), "i");
      finalAggregate.push({
        $match: {
          $or: [
            { firstName: { $regex: regex } },
            { lastName: { $regex: regex } },
            { email: { $regex: regex } },
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
        ? Teacher.aggregate(finalAggregate)
        : Teacher.aggregate([]);

        Teacher.aggregatePaginate(myAggregate, { page, limit }).then(
      (teachers) => {
        res.json(ApiResponse(teachers));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get Teacher by ID
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.json(ApiResponse({}, "Teacher not found", true));
    }

    return res.json(ApiResponse({ teacher }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


// Update Teacher
exports.updateTeacher = async (req, res) => {
  try {
    if (req.body.image) {
      let currentTeacher = await Teacher.findById(req.params.id);

      if (currentTeacher.image) {
        const filePath = `./Uploads/${currentTeacher.image}`;

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`File '${filePath}' deleted.`);
        } else {
          console.log(`File '${filePath}' does not exist.`);
        }
      }
    }

    let teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!teacher) {
      return res.json(ApiResponse({}, "No teacher found", false));
    }

    return res.json(ApiResponse(teacher, "Teacher Profile updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


// Delete Teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndRemove(req.params.id);

    if (!teacher) {
      return res.json(ApiResponse({}, "Teacher not found", false));
    }

    if (teacher.image) {
      const filePath = `./Uploads/${teacher.image}`;

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File '${filePath}' deleted.`);
      } else {
        console.log(`File '${filePath}' does not exist.`);
      }
    }

    return res.json(ApiResponse({}, "Teacher Deleted Successfully", true));
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
