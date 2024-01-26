const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const Service = require("../Models/Service")


//signup Validator
exports.addServiceValidator = [
  body('title').not().isEmpty().withMessage("Service title is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]