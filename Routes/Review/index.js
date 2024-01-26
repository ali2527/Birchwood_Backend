const express = require("express")
const { addReview,getAllReviewsByCoachId,getCoachRatings,getReviewById,deleteReview} = require("../../Controllers/Review");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {addReviewValidator} = require("../../Validator/reviewValidator")

router.post("/addReview",authenticatedRoute,addReviewValidator, addReview);
router.get("/getAllReviewsByCoachId/:coachId", getAllReviewsByCoachId);
router.get("/getCoachRatings/:coachId", getCoachRatings);
router.get("/getReviewById/:id", authenticatedRoute,getReviewById);
router.post("/deleteReview/:id", authenticatedRoute,deleteReview);

module.exports = router