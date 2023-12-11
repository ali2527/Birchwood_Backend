//Models
const User = require("../../Models/User");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const  sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");

//libraries
const dayjs = require("dayjs");


//register
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json(ApiResponse({}, "User with this Email Already Exist",false));
    }

    user = new User({
      firstName,
      lastName,
      email,
      password,
      isAdmin: true,
      status:"ACTIVE"
    });

    await user.save();

    return res
      .status(200)
      .json(
        ApiResponse(
          { user },
          true,
          "Admin Created Successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(ApiResponse({},  error.message,false));
  }
};

//signin
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    User.findOne({ email,isAdmin:true }).then((user) => {
        if (!user) {
          return res.json(ApiResponse({}, "Admin with this email not found", false));
        }
        if (!user.authenticate(password)) {
          return res.json(ApiResponse({}, "Invalid password!", false));
        }
        const token = generateToken(user);

        return res.json(ApiResponse({ user: sanitizeUser(user), token }, "Admin Logged In Successfully", true));
      })
      .catch((err) => {
        return res.json(ApiResponse({}, err.message, false));
      });
  } catch (error) {
    return res.status(500).json(ApiResponse({},  error.message,false));
  }
};

