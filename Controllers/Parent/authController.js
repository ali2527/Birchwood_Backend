//Models
const Parent = require("../../Models/Parent");
const Coach = require("../../Models/Teacher");
const Lesson = require("../../Models/Lesson");
const Payment = require("../../Models/Payment");
const Reset = require("../../Models/Reset");

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
exports.signup = async (req, res) => {
  // return;
  const {email} = req.body;
  try {
    let parent = await Parent.findOne({ email });

    if (parent) {
      return res
        .status(400)
        .json(ApiResponse({}, "Account with this Email Already Exist", false));
    }

    let parentId = await generateRandom6DigitID("P");
    console.log("parentId",parentId)

    parent = new Parent({
      ...req.body,
      parentId
    });

    await parent.save();

    const title ="New Account Signup"
    const content = `A new user has signed up on the app. Email : ${email}`
    sendNotificationToAdmin(title,content)   

    return res
      .status(200)
      .json(ApiResponse({ parent }, "Account Created Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

//signin
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    Parent.findOne({ email })
      .then((parent) => {
        if (!parent) {
          return res.json(
            ApiResponse({}, "Parent with this email not found", false)
          );
        }
        if (!parent.authenticate(password)) {
          return res.json(ApiResponse({}, "Invalid password!", false));
        }

        if (parent.status === "INACTIVE") {
          return res.json(
            ApiResponse({}, "Your Account is Not Active yet", false)
          );
        }

        const token = generateToken(parent);

        return res.json(
          ApiResponse(
            { parent: sanitizeUser(parent), token },
            "Parent Logged In Successfully",
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


