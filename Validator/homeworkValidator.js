const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const moment = require("moment");


//add Query Validator
exports.addHomeworkValidator = [
  body('title').not().isEmpty().withMessage("Title is Required"),
  body('description').not().isEmpty().withMessage("Description is Required"),
  body('dueDate').not().isEmpty().withMessage("Due Date is Required").custom((value) =>{
    if(moment(value).isSameOrBefore()){
        throw new Error("Due date must be after today");
    }
    return true;
  }),
  (req, res, next) => {
    const classroom = req.body.classroom;
    const child = req.body.children;

    // Check if both classroom and child are empty
    if (!classroom && !child) {
      return res.status(400).json(ApiResponse({}, 'Either Classroom or Child is required', false));
    }
    next();
  },
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]
