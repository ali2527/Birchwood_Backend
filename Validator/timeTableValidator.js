const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const Service = require("../Models/Service")


//signup Validator
exports.addTimeTableValidator = [
  body('classroom').not().isEmpty().withMessage("Classroom Id is Required"),
  body('day').not().isEmpty().withMessage("Day is Required"),
  body('startTime').not().isEmpty().withMessage("Start Time  is Required"),
  body('endTime').not().isEmpty().withMessage("End Time  is Required"),

  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]