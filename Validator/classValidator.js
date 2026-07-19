const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const Service = require("../Models/Service")


//add Query Validator
exports.addClassroomValidator = [
  body('classroomName').not().isEmpty().withMessage("Class Name is Required"),
  body('classroomGrade').not().isEmpty().withMessage("Class Grade is Required"),
  body('classroomBatch').not().isEmpty().withMessage("Class Batch is Required"), 
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]