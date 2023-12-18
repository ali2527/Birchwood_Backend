const { body, validationResult, check } = require('express-validator');
const { ApiResponse } = require("../Helpers")
const user = require("../Models/User")


//signup Validator
exports.signupValidator = [
  check('email', "Email is Required").not().isEmpty().isEmail().withMessage("Email is Invalid"),
  body('fatherFirstName').not().isEmpty().withMessage("Father First Name is Required"),
  body('fatherLastName').not().isEmpty().withMessage("Father Last Name is Required"),
  body('motherFirstName').not().isEmpty().withMessage("Mother First Name is Required"),
  body('motherLastName').not().isEmpty().withMessage("Mother Last Name is Required"),
  body('phone').not().isEmpty().withMessage("Phone Number is Required"),
  body('password').not().isEmpty().withMessage("Password is Required").isStrongPassword().withMessage("Password is too Weak"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]

//signin Validator
exports.signinValidator = [
  check('email', "Email is Required").not().isEmpty().isEmail().withMessage("Email is Invalid"),
  check('password', "Password is Required").not().isEmpty().withMessage("Password is Required"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()
  }
]

//email code Validator
exports.emailCodeValidator = [
  check('email', "Email is Required").not().isEmpty().isEmail().withMessage("Email is Invalid"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()
  }
]

//verify code Validator
exports.verifyCodeValidator = [
  check('email', "Email is Required").not().isEmpty().isEmail().withMessage("Email is Invalid"),
  check('code', "Verification Code is Required").not().isEmpty().isLength({ min: 4, max: 4   }).withMessage("Verification Code is Invalid"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()
  }
]

//reset password Validator
exports.resetPasswordValidator = [
  check('email', "Email is Required").not().isEmpty().isEmail().withMessage("Email is Invalid"),
  check('password', "Password is Required").not().isEmpty().isStrongPassword().withMessage("Password is too Weak"),
  check('confirmPassword', "Confirm Password is Required").not().isEmpty().custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
  check('code', "Verification Code is Required").not().isEmpty().isLength({ min: 4, max: 4 }).withMessage("Verification Code is Invalid"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()
  }
]

//admin signup Validator
exports.adminRegisterValidator = [
  check('email', "Email is Required").not().isEmpty().isEmail().withMessage("Email is Invalid"),
  body('firstName').not().isEmpty().withMessage("First Name is Required"),
  body('lastName').not().isEmpty().withMessage("Last Name is Required"),
  body('password').not().isEmpty().withMessage("Password is Required").isStrongPassword().withMessage("Password is too Weak"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()
  }
]


//signup coach Validator
exports.teacherSignupValidator = [
  check('email', "Email is Required").not().isEmpty().isEmail().withMessage("Email is Invalid"),
  body('email').not().isEmpty().withMessage("Email is Required"),
  body('firstName').not().isEmpty().withMessage("First Name is Required"),
  body('lastName').not().isEmpty().withMessage("Last Name is Required"),
  body('phone').not().isEmpty().withMessage("Phone Number is Required"),
  body('address').not().isEmpty().withMessage("Address is Required"),
  body('state').not().isEmpty().withMessage("State is Required"),
  body('city').not().isEmpty().withMessage("City is Required"),
  body('bio').not().isEmpty().withMessage("Bio is Required"),
  body('password').not().isEmpty().withMessage("Password is Required").isStrongPassword().withMessage("Password is too Weak"),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse({}, errors.array()[0].msg, false));
    }
    next()  
  }
]