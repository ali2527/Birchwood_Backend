const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const user = require("../Models/User")


//signup Validator
exports.addTeacherValidator = [
  check('email', "Email is Required").not().isEmpty().isEmail().withMessage("Email is Invalid"),
  body('firstName').not().isEmpty().withMessage("First Name is Required"),
  body('teacherId').not().isEmpty().withMessage("Teacher Id is Required"),
  body('lastName').not().isEmpty().withMessage("Last Name is Required"),
  body('phone').not().isEmpty().withMessage("Phone Number is Required"),
  body('address').not().isEmpty().withMessage("Address is Required"),
  body('city').not().isEmpty().withMessage("City is Required"),
  body('state').not().isEmpty().withMessage("State is Required"),
  body('image').not().isEmpty().withMessage("Image is Required"),
  // body('classroom').not().isEmpty().withMessage("Classroom is Required"),
  body('password').not().isEmpty().withMessage("Password is Required").isStrongPassword().withMessage("Password is too Weak"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]
