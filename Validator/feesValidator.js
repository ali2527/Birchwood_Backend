const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const moment = require("moment");


//add Query Validator
exports.createVoucherValidator = [
  body('children').not().isEmpty().withMessage("Child Id is Required"),
  body('amount').not().isEmpty().withMessage("Fee Amount is Required"),
  body('month').not().isEmpty().withMessage("Fee Month is Required"),
  body('year').not().isEmpty().withMessage("Fee Year is Required"),
  body('dueDate').not().isEmpty().withMessage("Due Date is Required").custom((value) =>{
    if(moment(value).isSameOrBefore()){
        throw new Error("Due date must be after today");
    }
    return true;
  }),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]
