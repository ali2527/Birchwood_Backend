 const express = require("express");
const {
  addHomework,
  getAllHomework,
  getAllChildHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
} = require("../../Controllers/Homework");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../Middlewares/auth");
const {addHomeworkValidator} = require("../../Validator/homeworkValidator")


router.post("/addHomework", authenticatedRoute,addHomeworkValidator, addHomework);
router.get("/getAllHomework",authenticatedRoute, getAllHomework);
router.get("/getAllChildHomework/:id", authenticatedRoute, getAllChildHomework);
router.get("/getHomeworkById/:id", authenticatedRoute, getHomeworkById);
router.post("/updateHomework/:id", authenticatedRoute, updateHomework);
router.get("/deleteHomework/:id", authenticatedRoute, deleteHomework);


module.exports = router;
