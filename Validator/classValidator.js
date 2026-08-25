const { body, validationResult } = require("express-validator");
const { ApiResponse } = require("../Helpers");
const { CLASSROOM_COLORS } = require("../constants/classroomColors");

//add Query Validator
exports.addClassroomValidator = [
  body('classroomName').not().isEmpty().withMessage("Class Name is Required"),
  body('classroomGrade').not().isEmpty().withMessage("Class Grade is Required"),
  body('classroomBatch').not().isEmpty().withMessage("Class Batch is Required"),
  body("color")
    .optional()
    .isIn(CLASSROOM_COLORS)
    .withMessage("Invalid class color"),  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]