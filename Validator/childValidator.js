const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")


//add Query Validator
exports.addChildValidator = [
  body('rollNumber').not().isEmpty().withMessage("Roll Number is Required"),
  body('firstName').not().isEmpty().withMessage("First name is Required"),
  body('lastName').not().isEmpty().withMessage("Last name is Required"),
  body('term').not().isEmpty().withMessage("Term is Required"),
  body('birthday').not().isEmpty().withMessage("Birthday is Required"),
  body('age').not().isEmpty().withMessage("Age is Required"),
  body('classroom').not().isEmpty().withMessage("Class is Required"),

  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]