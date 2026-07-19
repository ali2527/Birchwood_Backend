const express = require("express");
const {
  addQuiz,
  getAllQuiz,
  getAllQuizByLecture,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  attemptQuiz
} = require("../../Controllers/Quiz");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../Middlewares/auth");
const {addCategoryValidator} = require("../../Validator/categoryValidator")


router.post("/addQuiz", authenticatedRoute,addCategoryValidator, addQuiz);
router.get("/getAllQuiz", authenticatedRoute, getAllQuiz);
router.get("/getAllQuizByLecture/:lecture", authenticatedRoute, getAllQuizByLecture);
router.get("/getQuizById/:id", authenticatedRoute, getQuizById);
router.post("/updateQuiz/:id", authenticatedRoute, updateQuiz);
router.post("/deleteQuiz/:id", authenticatedRoute, deleteQuiz);
router.post("/attemptQuiz", authenticatedRoute, attemptQuiz);


module.exports = router;
