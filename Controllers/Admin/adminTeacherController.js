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

