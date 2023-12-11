//Models
const User = require("../../Models/User");
const Coach = require("../../Models/Teacher");
const Lesson = require("../../Models/Lesson");
const Payment = require("../../Models/Payment");
const Reset = require("../../Models/Reset");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const {sendNotificationToUser, sendNotificationToAdmin} = require("../../Helpers/notification")
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");

//libraries
const dayjs = require("dayjs");

//modules
const moment = require("moment");

//signup
exports.signup = async (req, res) => {
  const {
    firstName,
    age,
    parent,
    phoneNumber,
    homeNumber,
    school,
    gradeLevel,
    city,
    state,
    zip,
    subjects,
    email,
    password,
  } = req.body;
  try {
    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json(ApiResponse({}, "User with this Email Already Exist", false));
    }

    user = new User({
      ...req.body,
    });

    await user.save();

    const title ="New Student Signup"
    const content = `A new student has signed up on the app. Name : ${firstName}, Email : ${email}`
    sendNotificationToAdmin(title,content)   

    return res
      .status(200)
      .json(ApiResponse({ user }, "User Created Successfully", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

//signin
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    User.findOne({ email })
      .then((user) => {
        if (!user) {
          return res.json(
            ApiResponse({}, "User with this email not found", false)
          );
        }
        if (!user.authenticate(password)) {
          return res.json(ApiResponse({}, "Invalid password!", false));
        }

        if (user.status === "PENDING") {
          return res.json(
            ApiResponse({}, "Your Account is Not Verified yet", false)
          );
        }

        const token = generateToken(user);

        return res.json(
          ApiResponse(
            { user: sanitizeUser(user), token },
            "User Logged In Successfully",
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

//email verification code
exports.emailVerificationCode = async (req, res) => {
  try {
    let { email } = req.body;
    let verificationCode = generateString(4, false, true);
    console.log("verificationCode", verificationCode);
    await createResetToken(email, verificationCode);
    const encoded = Buffer.from(
      JSON.stringify({ email, code: verificationCode }),
      "ascii"
    ).toString("base64");
    const html = `
                <div>
                  <p>
                    You are receiving this because you (or someone else) have requested the reset of the
                    password for your account.
                  </p>
                  <p>Your verification status is ${verificationCode}</p>
                  <p>
                    <strong>
                      If you did not request this, please ignore this email and your password will remain
                      unchanged.
                    </strong>
                  </p>
                </div>
    `;
    await generateEmail(email, "The Birchwood Academy - Password Reset", html);
    return res.status(201).json({
      message:
        "Recovery status Has Been Emailed To Your Registered Email Address",
      encodedEmail: encoded,
    });
  } catch (err) {
    res.status(500).json({
      message: err.toString(),
    });
  }
};

//verify recover code
exports.verifyRecoverCode = async (req, res) => {
  try {
    const { code, email } = req.body;
    const isValidCode = await validateResetToken(code, email);

    if (isValidCode) {
      return res
        .status(200)
        .json(ApiResponse({}, "Verification Code Verified", true));
    } else
      return res
        .status(400)
        .json(ApiResponse({}, "Invalid Verification Code", false));
  } catch (err) {
    res.status(500).json({
      message: err.toString(),
    });
  }
};

//reset password
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirm_password, code, email } = req.body;

    const reset_status = await validateResetToken(code, email);

    if (!reset_status) {
      return res
        .status(400)
        .json(ApiResponse({}, "Verification Code dosent Match Email", false));
    }

    let user = await User.findOne({ email });

    await Reset.deleteOne({ code: code, email: email });

    user.password = password;
    await user.save();

    await res
      .status(201)
      .json(ApiResponse({}, "Password Updated Successfully", true));
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
  }
};


