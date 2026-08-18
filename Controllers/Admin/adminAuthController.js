const Teacher = require("../../Models/Teacher");
const Parent = require("../../Models/Parent");
const { generateToken, ApiResponse } = require("../../Helpers/index");
const sanitizeUser = require("../../Helpers/sanitizeUser");

exports.register = async (req, res) => {
  if (process.env.ALLOW_ADMIN_REGISTER !== "true") {
    return res.status(403).json(ApiResponse({}, "Admin registration is disabled", false));
  }
  const { firstName, lastName, email, password } = req.body;
  try {
    let teacher = await Teacher.findOne({ email });
    let parent = await Parent.findOne({ email });

    if (parent || teacher) {
      return res
        .status(400)
        .json(ApiResponse({}, "User with this Email Already Exist", false));
    }

    parent = new Parent({
      firstName,
      lastName,
      email,
      password,
      isAdmin: true,
      status: "ACTIVE",
    });

    await parent.save();

    return res.status(200).json(
      ApiResponse({ parent: sanitizeUser(parent) }, true, "Admin Created Successfully")
    );
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    Parent.findOne({ email, isAdmin: true })
      .then((user) => {
        if (!user) {
          return res.json(ApiResponse({}, "Admin with this email not found", false));
        }
        if (!user.authenticate(password)) {
          return res.json(ApiResponse({}, "Invalid password!", false));
        }
        const token = generateToken(user);
        return res.json(
          ApiResponse({ user: sanitizeUser(user), token }, "Admin Logged In Successfully", true)
        );
      })
      .catch((err) => {
        return res.json(ApiResponse({}, err.message, false));
      });
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};
