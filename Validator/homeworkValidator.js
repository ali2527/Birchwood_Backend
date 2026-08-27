const { body, validationResult } = require("express-validator");
const { ApiResponse } = require("../Helpers");
const moment = require("moment");

exports.addHomeworkValidator = [
  body("title").not().isEmpty().withMessage("Title is required"),
  body("description").not().isEmpty().withMessage("Description is required"),
  body("dueDate")
    .not()
    .isEmpty()
    .withMessage("Due date is required")
    .custom((value) => {
      if (!moment(value).isValid()) {
        throw new Error("Due date is invalid");
      }
      if (moment(value).isSameOrBefore(moment(), "day")) {
        throw new Error("Due date must be after today");
      }
      return true;
    }),
  body("assignee")
    .optional()
    .isIn(["CLASS", "CHILD"])
    .withMessage("Assignee must be CLASS or CHILD"),
  body("type")
    .optional()
    .isIn(["HOMEWORK", "NOTICE", "WARNING"])
    .withMessage("Invalid homework type"),
  (req, res, next) => {
    const assignee = req.body.assignee || "CHILD";

    if (assignee === "CLASS" && !req.body.classroom) {
      return res.status(400).json(ApiResponse({}, "Classroom is required for class assignments", false));
    }

    if (assignee === "CHILD" && !req.body.children) {
      return res.status(400).json(ApiResponse({}, "Student is required for individual assignments", false));
    }

    next();
  },
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next();
  },
];
