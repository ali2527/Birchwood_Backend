const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")


//teacher Attendance Validator
exports.teacherCheckInValidator = [
  body('checkIn').not().isEmpty().withMessage("checkIn Date/Time is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]

exports.teacherCheckOutValidator = [
  body('checkOut').not().isEmpty().withMessage("checkOut Date/Time is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]

//child Leave Validator
exports.teacherLeaveValidator = [
  body('leaveReason').not().isEmpty().withMessage("Leave Reason is Required"),
  body('leaveType').not().isEmpty().withMessage("Leave Type is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]


//child Attendance Validator
exports.childCheckInValidator = [
  body('checkIn').not().isEmpty().withMessage("checkIn Date/Time is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]

//child Leave Validator
exports.childLeaveValidator = [
  body('leaveReason').not().isEmpty().withMessage("Leave Reason is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]
