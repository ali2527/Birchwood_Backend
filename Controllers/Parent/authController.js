const Parent = require("../../Models/Parent");
const { generateToken, ApiResponse, generateRandom6DigitID, pick } = require("../../Helpers/index");
const { sendNotificationToAdmin } = require("../../Helpers/notification");
const sanitizeUser = require("../../Helpers/sanitizeUser");

const PARENT_SIGNUP_FIELDS = [
  "fatherFirstName",
  "fatherLastName",
  "motherFirstName",
  "motherLastName",
  "email",
  "phone",
  "password",
  "address",
  "city",
  "state",
  "image",
];

exports.signup = async (req, res) => {
  const { email } = req.body;
  try {
    let parent = await Parent.findOne({ email });

    if (parent) {
      return res
        .status(400)
        .json(ApiResponse({}, "Account with this Email Already Exist", false));
    }

    const parentId = generateRandom6DigitID("P");

    parent = new Parent({
      ...pick(req.body, PARENT_SIGNUP_FIELDS),
      parentId,
      isAdmin: false,
    });

    await parent.save();

    sendNotificationToAdmin(
      "New Account Signup",
      `A new user has signed up on the app. Email : ${email}`
    );

    return res.status(200).json(
      ApiResponse(
        { parent: sanitizeUser(parent) },
        "Account Created Successfully",
        true
      )
    );
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};

exports.signin = async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase(); // Convert email to lowercase

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
