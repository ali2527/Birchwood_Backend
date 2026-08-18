const Notification = require("../Models/Notification");

exports.sendNotificationToUser = async (userId, title, content, type = "NOTIFICATION") => {
  try {
    const notification = new Notification({
      title,
      content,
      assignee: userId,
      type,
    });
    await notification.save();
  } catch (error) {
    console.error("Error saving notification:", error);
  }
};

exports.sendNotificationToAdmin = async (title, content, type = "NOTIFICATION") => {
  try {
    const notification = new Notification({
      title,
      content,
      isAdmin: true,
      type,
    });
    await notification.save();
  } catch (error) {
    console.error("Error saving notification:", error);
  }
};
