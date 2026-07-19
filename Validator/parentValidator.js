const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")


//add Query Validator
exports.addParentValidator = [
  body('motherFirstName').not().isEmpty().withMessage("Mother's First Name is Required"),
body('motherLastName').optional(),
body('fatherFirstName').not().isEmpty().withMessage("Father's First Name is Required"),
body('fatherLastName').optional(),
body('email').isEmail().withMessage("Valid Email is Required"),
body('phone').not().isEmpty().withMessage("Phone Number is Required"),
body('address').optional(),
body('city').optional(),
body('state').optional(),
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
