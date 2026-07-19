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
const Admin = require("../../Models/Admin");

//email verification code
exports.emailVerificationCode = async (req, res) => {
  try {
    let { email } = req.body;

    let parent = await Parent.findOne({ email });
    let teacher = await Teacher.findOne({ email });
    let admin = await Admin.findOne({ email });

    if (!parent && !teacher && !admin) {
      return res
        .status(400)
        .json(ApiResponse({}, "User With this email does not exist", false));
    }

    let verificationCode = generateString(4, false, true);

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

//reset password Parent
exports.resetPasswordParent = async (req, res) => {
  try {
    const { password, confirm_password, code, email } = req.body;


    // Validate reset token
    const reset_status = await validateResetToken(code, email);
    if (!reset_status) {
      return res
        .status(400)
        .json(ApiResponse({}, "Verification Code doesn't Match Email", false));
    }

    // Find the user in the Parent model only
    const parent = await Parent.findOne({ email });
    if (!parent) {
      return res.status(404).json(ApiResponse({}, "Parent not found", false));
    }

    // Delete reset token
    await Reset.deleteOne({ code, email });

    // Update password
    parent.password = password;
    await parent.save();

    return res
      .status(201)
      .json(ApiResponse({}, "Parent Password Updated Successfully", true));
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
  }
};


//reset password teacher
exports.resetPasswordTeacher = async (req, res) => {
  try {
    const { password, confirm_password, code, email } = req.body;

    // Validate reset token
    const reset_status = await validateResetToken(code, email);
    if (!reset_status) {
      return res
        .status(400)
        .json(ApiResponse({}, "Verification Code doesn't Match Email", false));
    }

    // Find the user in the Teacher model only
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(404).json(ApiResponse({}, "Teacher not found", false));
    }

    // Delete reset token
    await Reset.deleteOne({ code, email });

    // Update password
    teacher.password = password;
    await teacher.save();

    return res
      .status(201)
      .json(ApiResponse({}, "Teacher Password Updated Successfully", true));
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
  }
};


//reset password admin
exports.resetPasswordAdmin = async (req, res) => {
  try {
    const { password, confirm_password, code, email } = req.body;

    // Validate reset token
    const reset_status = await validateResetToken(code, email);
    if (!reset_status) {
      return res
        .status(400)
        .json(ApiResponse({}, "Verification Code doesn't Match Email", false));
    }

    // Find the user in the Admin model only
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json(ApiResponse({}, "Admin not found", false));
    }

    // Delete reset token
    await Reset.deleteOne({ code, email });

    // Update password
    admin.password = password;
    await admin.save();

    return res
      .status(201)
      .json(ApiResponse({}, "Admin Password Updated Successfully", true));
  } catch (err) {
    res.status(500).json(ApiResponse({}, err.toString(), false));
  }
};
