const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const Service = require("../Models/Service")


//add Query Validator
exports.addLessonValidator = [
  body('subject').not().isEmpty().withMessage("Subject is Required"),
  body('lessonType').not().isEmpty().withMessage("Lesson Type is Required")
    .isIn(["COACHING", "TUTORING"]).withMessage("Invalid Lesson Type"),
  body('coachId').not().isEmpty().withMessage("Coach Id is Required"),
  body('studentId').not().isEmpty().withMessage("Student Id is Required"),
  body('slots').isArray({ min: 1 }).withMessage("Atleast 1 Time Slot is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]