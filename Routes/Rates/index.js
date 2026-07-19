const express = require("express")
const { setRates,getMyRates,getCoachRates } = require("../../Controllers/Rates");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {ratesValidator} = require("../../Validator/ratesValidator")

router.post("/setRates",authenticatedRoute,ratesValidator, setRates);
router.get("/getMyRates",authenticatedRoute,getMyRates)
router.get("/getCoachRates/:id",authenticatedRoute,getCoachRates)

module.exports = router