const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const Service = require("../Models/Service")


//add Query Validator
exports.addQueryValidator = [
  body('name').not().isEmpty().withMessage("Name is Required"),
  body('email').not().isEmpty().withMessage("Email is Required"),
  body('subject').not().isEmpty().withMessage("Subject is Required"),
  body('message').not().isEmpty().withMessage("Message is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]