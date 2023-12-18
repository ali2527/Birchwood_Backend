//Models
const Teacher = require("../../Models/Teacher");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { sendNotificationToAdmin } = require("../../Helpers/notification");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");

//libraries
const dayjs = require("dayjs");
const Service = require("../../Models/Service");

//register
exports.register = async (req, res) => {
  try {
    let teacher = await Teacher.findOne({ email: req.body.email });

    if (teacher) {
      return res
        .status(400)
        .json(ApiResponse({}, "Teacher with this Email Already Exist", false));
    }

    const data = {
      ...req.body,
      education: JSON.parse(req.body.education),
      employment: JSON.parse(req.body.employment),
      subjects: JSON.parse(req.body.subjects),
      service: JSON.parse(req.body.service),
    };

    teacher = new Teacher(data);

    await teacher.save();

    const title = "New Teacher Signup";
    const content = `A new teacher has been added on the app and is pending Approval. Name : ${
      req.body.firstName + " " + req.body.lastName
    }, Email : ${req.body.email}`;
    sendNotificationToAdmin(title, content);

    return res
      .status(200)
      .json(ApiResponse({ teacher }, "Teacher Created Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

//signin
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    Teacher.findOne({ email })
      .then((user) => {
        if (!user) {
          return res.json(
            ApiResponse({}, "Teacher with this email not found", false)
          );
        }
        if (!user.authenticate(password)) {
          return res.json(ApiResponse({}, "Invalid password!", false));
        }
        if (user.status == "PENDING") {
          return res.json(
            ApiResponse({}, "Account Still Pending Approval from Admin!", false)
          );
        }
        const token = generateToken(user);

        return res.json(
          ApiResponse(
            { user: sanitizeUser(user), token },
            "Teacher Logged In Successfully",
            true
          )
        );
      })
      .catch((err) => {
        return res.json(ApiResponse({}, err.message, false));
      });
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};
