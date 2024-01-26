const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const Service = require("../Models/Service")


//add Query Validator
exports.ratesValidator = [
  body('coachId').not().isEmpty().withMessage("CoachId is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]