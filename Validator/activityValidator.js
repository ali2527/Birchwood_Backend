const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const user = require("../Models/User")


//signup Validator
exports.addActivityValidator = [
  body('title').not().isEmpty().withMessage("Title is Required"),
  body('image').not().isEmpty().withMessage("Image is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]
