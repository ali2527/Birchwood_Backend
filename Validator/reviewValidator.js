const { body, validationResult, check } = require("express-validator");
const { ApiResponse } = require("../Helpers");
const Service = require("../Models/Service");

//signup Validator
exports.addReviewValidator = [
  body("coach").not().isEmpty().withMessage("Coach Id is Required"),
  body("rating")
    .not()
    .isEmpty()
    .withMessage("Rating is Required")
    .isInt({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5"),
  body("comment").not().isEmpty().withMessage("Comment is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next();
  },
];
