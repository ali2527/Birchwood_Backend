const express = require("express");
const {
  getAllAdminNotifications,
  getUnreadAdminNotifications,
  getNotificationDetail,
  createAlertOrAnnoucement,
  updateNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUserNotifications,
  getUnreadUserNotifications,
} = require("../../Controllers/Notification");
const { adminRoute, authenticatedRoute } = require("../../Middlewares/auth");

const router = express.Router();

router.get("/getAllAdminNotifications", adminRoute, getAllAdminNotifications);
router.get("/getUnreadAdminNotifications", adminRoute, getUnreadAdminNotifications);
router.get("/getUserNotifications", authenticatedRoute, getUserNotifications);
router.get("/getUnreadUserNotifications", authenticatedRoute, getUnreadUserNotifications);
router.get("/notificationDetail/:id", adminRoute, getNotificationDetail);
router.post("/createAlertOrAnnoucement", adminRoute, createAlertOrAnnoucement);
router.post("/updateNotification/:id", adminRoute, updateNotification);
router.post("/markAsRead/:id", authenticatedRoute, markAsRead);
router.post("/markAllAsRead", adminRoute, markAllAsRead);
router.get("/deleteNotification/:id", adminRoute, deleteNotification);

module.exports = router;
