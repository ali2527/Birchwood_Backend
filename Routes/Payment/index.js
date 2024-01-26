const express = require("express")
const { lessonPayment,getAllPayments,createCharge,coursePayment } = require("../../Controllers/Payment");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {lessonPaymentValidator,coursePaymentValidator} = require("../../Validator/paymentValidator")

router.post("/createCharge", createCharge);

router.post("/lessonPayment",authenticatedRoute,lessonPaymentValidator, lessonPayment);
router.post("/coursePayment",authenticatedRoute,coursePaymentValidator, coursePayment);
router.get("/getAllPayments",authenticatedRoute,getAllPayments)

module.exports = router