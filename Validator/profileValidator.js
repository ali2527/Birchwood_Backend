const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const user = require("../Models/User")



//reset password Validator
exports.changePasswordValidator = [
  check('old_password', "Old Password is Required").not().isEmpty(),
  check('new_password', "New Password is Required").not().isEmpty().isStrongPassword().withMessage("New Password is too Weak"),
  check('confirmPassword', "Confirm Password is Required").not().isEmpty().custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  }),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()
  }
]


