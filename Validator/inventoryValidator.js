const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")


//add Query Validator
exports.addInventoryValidator = [
  body('title').not().isEmpty().withMessage("Title is Required"),
  body('description').not().isEmpty().withMessage("Inventory Description is Required"),
  body('category').not().isEmpty().withMessage("Inventory Category is Required"),
  body('description').not().isEmpty().withMessage("Inventory Description is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]