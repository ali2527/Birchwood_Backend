//Models
const Teacher = require("../../Models/Teacher");
const Parent = require("../../Models/Parent");
const Reset = require("../../Models/Reset");

//Helpers
const { ApiResponse } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { generateEmail } = require("../../Helpers/email");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");

//email verification code
exports.emailVerificationCode = async (req, res) => {
  try {
    let { email } = req.body;

    let parent = await Parent.findOne({ email });
    let teacher = await Teacher.findOne({ email });

    if (!parent && !teacher) {
      return res
        .status(400)
        .json(ApiResponse({}, "User With this email does not exist", false));
    }

    let verificationCode = generateString(4, false, true);

    console.log(verificationCode)
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
                  <p>Your verification code is ${verificationCode}</p>
                  <p>
                    <strong>
                      If you did not request this, please ignore this email and your password will remain
                      unchanged.
                    </strong>
                  </p>
                </div>
    `;
    await generateEmail(email, "The Birchwood Academy - Password Reset", html);
    res
      .status(201)
      .json(
        ApiResponse(
          { encodedEmail: encoded },
          "Recovery code has been emailed to your registered email address",
          true
        )
      );
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
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
    res.status(500).json(ApiResponse({}, err.toString(), false));
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
    let parent = await Parent.findOne({ email });
    let teacher = await Teacher.findOne({ email });

    await Reset.deleteOne({ code: code, email: email });

    if (parent) {
      parent.password = password;
      await parent.save();
    } else {
      teacher.password = password;
      await teacher.save();
    }
    await res
      .status(201)
      .json(ApiResponse({}, "Password Updated Successfully", true));
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
  }
};
