const express = require("express")
const {getAllNotifications,getAllMyNotifications,sendNotification,getAllAdminNotifications,getUnreadAdminNotifications,sendNotificationToAdmin,getUnreadNotifications,toggleNotification,getNotificationById,sendPushNotification,deleteNotification} = require("../../Controllers/Notification");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")


router.post("/toggleNotification/:id",authenticatedRoute, toggleNotification);
router.get("/getAllNotifications",authenticatedRoute, getAllNotifications);
router.get("/getNotificationById/:id",authenticatedRoute, getNotificationById);
router.get("/getAllMyNotifications",authenticatedRoute,getAllMyNotifications);
router.get("/getAllAdminNotifications",authenticatedRoute,getAllAdminNotifications);
router.get("/getUnreadAdminNotifications",authenticatedRoute,getUnreadAdminNotifications)
router.get("/getUnreadNotifications",authenticatedRoute,getUnreadNotifications)
router.post("/sendNotification",authenticatedRoute,sendNotification);
router.post("/sendNotificationToAdmin",authenticatedRoute,sendNotificationToAdmin);
router.post("/sendPushNotification",authenticatedRoute,sendPushNotification)


module.exports = router