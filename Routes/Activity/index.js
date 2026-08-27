const express = require("express");
const {
  addActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} = require("../../Controllers/Activity/index");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../Middlewares/auth");
const { uploadFile } = require("../../Middlewares/upload");
const { addActivityValidator } = require("../../Validator/activityValidator");

router.post("/addActivity", adminRoute, uploadFile, addActivityValidator, addActivity);
router.get("/getAllActivities", authenticatedRoute, getAllActivities);
router.get("/getActivityById/:id", authenticatedRoute, getActivityById);
router.post("/updateActivity/:id", adminRoute, uploadFile, updateActivity);
router.get("/deleteActivity/:id", adminRoute, deleteActivity);

module.exports = router;
