const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")


//add Query Validator
exports.addLectureValidator = [
  body('lectureNo').not().isEmpty().withMessage("lecture No is Required"),
  body('title').not().isEmpty().withMessage("title is Required"),
  body('course').not().isEmpty().withMessage("course is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]