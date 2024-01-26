const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")


//add Query Validator
exports.addInventoryValidator = [
  body('courseCode').not().isEmpty().withMessage("Course code is Required"),
  body('title').not().isEmpty().withMessage("Title is Required"),
//   body('duration').not().isEmpty().withMessage("Course duration is Required"),
  body('price').not().isEmpty().withMessage("Course price is Required"),

  // body('features').isArray({ min: 1 }).withMessage("Atleast 1 feature is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]