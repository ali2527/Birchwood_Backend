const express = require("express");
const { getOverview } = require("../../../Controllers/Admin/adminDashboardController");
const { adminRoute } = require("../../../Middlewares/auth");

const router = express.Router();

router.get("/overview", adminRoute, getOverview);

module.exports = router;
