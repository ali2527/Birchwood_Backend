const Notification = require("../Models/Notification");
const { getIO } = require("../config/socket"); // Import the getIO function
const mongoose = require("mongoose")



  exports.sendNotificationToUser = async (userId, title,content, type="NOTIFICATION") => {
  
    // Check if the user is connected to a socket room with their ID
    const roomName = userId.toString(); // Assuming the room name is the same as the user's ID
    const io = getIO();
    // Get the socket associated with the room
    const userSocket = io.sockets.in(roomName);
  
    // Check if the socket exists
    if (userSocket) {
      // Emit a custom event for the notification
      userSocket.emit("notification", { title,content,isRead:false });
  
      // Save the notification to the database
      try {
        const notification = new Notification({
            title,
          content: content,
          assignee: userId,
          type,
        });
        await notification.save();
        console.log("Notification saved to the database.");
      } catch (error) {
        console.error("Error saving notification:", error);
      }
    } else {
      console.log(`User with ID ${userId} is not connected.`);
    }
  };

  exports.sendNotificationToAdmin = async (title,content, type="NOTIFICATION") => {
  
    // Check if the user is connected to a socket room with their ID
    
    const io = getIO();
    // Get the socket associated with the room
    const userSocket = io.sockets.in("admin");
  
    if (userSocket) {
      // Emit a custom event for the notification
      userSocket.emit("notification", { title,content,isRead:false });
      userSocket.emit("notificationAll", { title,content,isRead:false });
  
  
      // Save the notification to the database
      try {
        const notification = new Notification({
            title,
          content: content,
          isAdmin: true,
          type,
        });
        await notification.save();
        console.log("Notification saved to the database.");
      } catch (error) {
        console.error("Error saving notification:", error);
      }
    } else {
      console.log(`User with ID admin is not connected.`);
    }
  };



