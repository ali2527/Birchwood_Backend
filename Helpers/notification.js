const Notification = require("../Models/Notification");
const {
  emitAdminNotification,
  emitUserNotification,
  emitAdminNotificationRead,
  emitUserNotificationRead,
} = require("./socketEmitter");
const {
  SEND_TO,
  normalizeSendTo,
  normalizeIdList,
  countRecipients,
  queueBroadcast,
} = require("./notificationBroadcast");

exports.sendNotificationToUser = async (
  userId,
  title,
  content,
  type = "NOTIFICATION",
  extras = {}
) => {
  try {
    const notification = await Notification.create({
      title,
      content,
      assignee: userId,
      type,
      isRead: false,
      sendTo: extras.sendTo || SEND_TO.ADMIN,
      broadcastId: extras.broadcastId,
      recipientRole: extras.recipientRole || "",
    });
    emitUserNotification(String(userId), notification);
    return notification;
  } catch (error) {
    console.error("Error saving notification:", error);
    return null;
  }
};

exports.sendNotificationToAdmin = async (title, content, type = "NOTIFICATION") => {
  try {
    const notification = await Notification.create({
      title,
      content,
      isAdmin: true,
      type,
      isRead: false,
      sendTo: SEND_TO.ADMIN,
    });
    emitAdminNotification(notification);
    return notification;
  } catch (error) {
    console.error("Error saving notification:", error);
    return null;
  }
};

exports.createAdminNotification = async ({
  title,
  content,
  type = "ANNOUNCEMENT",
  sendTo = SEND_TO.ADMIN,
  targetTeachers = [],
  targetParents = [],
  targetClassroom = null,
}) => {
  const audience = normalizeSendTo(sendTo);
  const shouldBroadcast = audience !== SEND_TO.ADMIN;
  const recipientTotal = shouldBroadcast
    ? await countRecipients({
        sendTo: audience,
        targetTeachers,
        targetParents,
        targetClassroom,
      })
    : 0;

  const notification = await Notification.create({
    title,
    content,
    type,
    isAdmin: true,
    isRead: false,
    sendTo: audience,
    targetTeachers: normalizeIdList(targetTeachers),
    targetParents: normalizeIdList(targetParents),
    targetClassroom:
      targetClassroom && require("mongoose").Types.ObjectId.isValid(String(targetClassroom))
        ? targetClassroom
        : undefined,
    deliveryStatus: shouldBroadcast ? "QUEUED" : "",
    deliveryStats: shouldBroadcast
      ? { total: recipientTotal, sent: 0, failed: 0 }
      : { total: 0, sent: 0, failed: 0 },
  });

  emitAdminNotification(notification);

  if (shouldBroadcast && recipientTotal > 0) {
    queueBroadcast(notification._id);
  } else if (shouldBroadcast) {
    await Notification.findByIdAndUpdate(notification._id, {
      deliveryStatus: "COMPLETED",
      deliveryStats: { total: 0, sent: 0, failed: 0 },
    });
  }

  return notification;
};

exports.markAdminNotificationRead = async (notificationId) => {
  emitAdminNotificationRead({ id: notificationId, isRead: true });
};

exports.markAdminNotificationUnread = async (notificationId) => {
  emitAdminNotificationRead({ id: notificationId, isRead: false });
};

exports.markAllAdminNotificationsRead = async () => {
  emitAdminNotificationRead({ all: true, isRead: true });
};

exports.markUserNotificationRead = async (userId, notificationId, isRead = true) => {
  emitUserNotificationRead(userId, { id: notificationId, isRead });
};
