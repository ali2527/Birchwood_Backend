const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")


//signup Validator
exports.addTeacherValidator = [
//   check('email', "Email is Required").not().isEmpty().isEmail().withMessage("Email is Invalid"),
  
  body('firstName').not().isEmpty().withMessage("First Name is Required"),
  body('lastName').not().isEmpty().withMessage("Last Name is Required"),
  body('email').not().isEmpty().withMessage("Email is Required").isEmail().withMessage("Email is Invalid"),
  body('phone').not().isEmpty().withMessage("Phone Number is Required"),
  body('address').not().isEmpty().withMessage("Address is Required"),
  body('city').not().isEmpty().withMessage("City is Required"),
  body('image').not().isEmpty().withMessage("Image is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]


exports.resetPasswordValidator = [
  body('password').not().isEmpty().withMessage("Password is Required").isStrongPassword().withMessage("Password is too Weak"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]


exports.markAttendanceValidator = [
  body('date').not().isEmpty().withMessage("Date is Required"),
  body('status').not().isEmpty().withMessage("Status is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]