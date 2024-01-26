//Models
const Teacher = require("../../Models/Teacher");
const Parent = require("../../Models/Parent");


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
    let teacher = await Teacher.findOne({ email });
    let parent = await Parent.findOne({ email });

    if (parent || teacher) {
      return res
        .status(400)
        .json(ApiResponse({}, "User with this Email Already Exist",false));
    }

    parent = new Parent({
      firstName,
      lastName,
      email,
      password,
      isAdmin: true,
      status:"ACTIVE"
    });

    await parent.save();

    return res
      .status(200)
      .json(
        ApiResponse(
          { parent },
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
    Parent.findOne({ email,isAdmin:true }).then((user) => {
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

