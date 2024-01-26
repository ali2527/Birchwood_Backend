const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const user = require("../Models/User")


//signup Validator
exports.createMessageValidator = [
  body('content').not().isEmpty().withMessage("Message content is Required"),
  body('chatId').not().isEmpty().withMessage("Chat ID is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]