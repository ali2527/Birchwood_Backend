const Notification = require("../Models/Notification");
const { getIO } = require("../config/socket"); // Import the getIO function
const mongoose = require("mongoose")
const Children = require("../Models/Children");
const Post = require("../Models/Post");
const { sendNotificationToUser } = require("./notification");

exports.sendChildAssignmentNotification = async (parentId, childData) => {
  const roomName = parentId.toString(); // Room name is the parent's ID
  const io = getIO();

  // Check if the parent is connected
  const room = io.sockets.adapter.rooms.get(roomName);

  if (room && room.size > 0) {
    // Emit a "childAssignment" event to the parent
    io.to(roomName).emit("childAssignment", { childData, isRead: false });

    console.log(`Child assignment notification sent to parent ${parentId}`);
  } else {
    console.log(`Parent with ID ${parentId} is not connected.`);
  }

  // Save the notification to the database
  try {
    const notification = new Notification({
      title: "Child Assigned",
      content: `A child has been assigned to you: ${childData.firstName} ${childData.lastName}`,
      assignee: parentId,
      type: "NOTIFICATION",
    });
    await notification.save();
    console.log("Child assignment notification saved to the database.");
  } catch (error) {
    console.error("Error saving child assignment notification:", error);
  }
};

//socket for child check in by parent or teacher seperate socket
exports.childCheckinNotification = async (recieverId, childData, attendance) => {
  const roomName = recieverId.toString();
  const io = getIO();
  
  // Check if the user is connected
  const room = io.sockets.adapter.rooms.get(roomName);
  
  if (room && room.size > 0) {
    io.to(roomName).emit(`childCheckIn`, { childId: childData?._id, newAttendance: attendance });
  } else {
    console.log(`User with ID ${recieverId} is not connected.`);
  }

  // Save the notification to the database
  try {
    const notification = new Notification({
      title: "Child Checked In",
      content: `${childData.firstName} ${childData.lastName} has been checked in.`,
      assignee: recieverId,
      type: "NOTIFICATION",
    });
    await notification.save();
    console.log("Child check-in notification saved to the database.");
  } catch (error) {
    console.error("Error saving child assignment notification:", error);
  }
};

//socket for child leave by parent or teacher seperate socket
exports.childLeaveNotification = async (recieverId, childData, attendance) => {
  const roomName = recieverId.toString(); // Room name is the receiver's ID
  const io = getIO();

  // Check if the user is connected to the room
  const room = io.sockets.adapter.rooms.get(roomName);

  if (room && room.size > 0) {
    // Emit a "childLeave" event to the specific user
    io.to(roomName).emit("childLeave", { childData, todayAttendance: attendance });

    console.log(`Child leave notification sent to user ${recieverId}`);
  } else {
    console.log(`User with ID ${recieverId} is not connected.`);
  }

  // Save the notification to the database
  try {
    const notification = new Notification({
      title: "Child Leave",
      content: `${childData.firstName} ${childData.lastName} has taken a leave.`,
      assignee: recieverId,
      type: "NOTIFICATION",
    });
    await notification.save();
    console.log("Child leave notification saved to the database.");
  } catch (error) {
    console.error("Error saving child leave notification:", error);
  }
};

exports.sendCommentNotification = async ({ post, authorType, comment }) => {
  const io = getIO();
  post = await post.populate([{ path: 'children' }]);

  const teacherId = post.author._id.toString();
  let parentIds = new Set();

  // Get users in the specific post room (room = post._id)
  const postRoom = io.sockets.adapter.rooms.get(post._id.toString()) || new Set();
  const connectedUsers = new Set(postRoom);

  if (post.type === "CHILD") {
    // Get parents from children (removing duplicates)
    post.children.forEach((child) => parentIds.add(child.parent.toString()));
  } else if (post.type === "CLASS") {
    // Fetch all children in the classroom & extract parents
    const childrenInClass = await Children.find({ classroom: post.classroom });
    childrenInClass.forEach((child) => parentIds.add(child.parent.toString()));
  }

  io.to(post._id.toString()).emit("newComment", {
    comment,
  });

  // User is either offline or just not in the post room
  const isUserOnlineButNotInPost = (userId) => {
    const socketIds = io.sockets.adapter.rooms.get(userId);
    if (!socketIds) return false; // User is offline

    // Check if any of the user's sockets is in the post room
    const isInPostRoom = [...socketIds].some(socketId => connectedUsers.has(socketId));
    return !isInPostRoom; // True if online but not in post room
  };

  if (authorType === "parent") {
    // Notify teacher ONLY IF they are not in the post room
    if (isUserOnlineButNotInPost(teacherId)) {
      sendNotificationToUser(teacherId, "New Comment", `A parent commented on post ${post._id}`);
    }
  } else if (authorType === "teacher") {
    // Filter parents whose are not in the post room
    const onlineParentsNotInPostRoom = [...parentIds].filter(isUserOnlineButNotInPost);
    if (onlineParentsNotInPostRoom.length) {
      await Promise.all(
        onlineParentsNotInPostRoom.map(parentId =>
          sendNotificationToUser(parentId, "New Comment", `The teacher commented on post ${post._id}`)
        )
      );
    }
  }
};

exports.sendLikeAndLoveNotification = async ({ user, post, authorType, userId, title, msg }) => {
  const io = getIO();
  post = await post.populate([{ path: 'children' }]);

  const teacherId = post.author._id.toString();
  let parentIds = new Set();
  let roomName = 'livePostFeed'

  // Get users in the live feed room
  const livePostFeedRoom = io.sockets.adapter.rooms.get(roomName) || new Set();
  const connectedUsers = new Set(livePostFeedRoom);

  if (post.type === "CHILD") {
    // Get parents from children (removing duplicates)
    post.children.forEach((child) => parentIds.add(child.parent.toString()));
  } else if (post.type === "CLASS") {
    // Fetch all children in the classroom & extract parents
    const childrenInClass = await Children.find({ classroom: post.classroom });
    childrenInClass.forEach((child) => parentIds.add(child.parent.toString()));
  }

  io.to(roomName).emit('postInteraction', {
    userId,
    postId: post._id,
    interactionType: title,
  });

  // User is either offline or just not in the live feed room
  const isUserOnlineButNotLiveFeedRoom = (userId) => {
    const socketIds = io.sockets.adapter.rooms.get(userId);
    if (!socketIds) return false; // User is offline

    // Check if any of the user's sockets is in the live feed room
    const isInlivePostFeedRoom = [...socketIds].some(socketId => connectedUsers.has(socketId));
    return !isInlivePostFeedRoom; // True if online but not in live feed room
  };

  if (authorType === "parent") {
    // Notify teacher ONLY IF they are not in the live feed room
    if (isUserOnlineButNotLiveFeedRoom(teacherId)) {
      sendNotificationToUser(teacherId, title, msg + ": " + post._id);
    }
  } else if (authorType === "teacher") {
    // Filter parents whose are not in the live feed room
    const onlineParentsNotInLiveFeedRoom = [...parentIds].filter(isUserOnlineButNotLiveFeedRoom);
    if (onlineParentsNotInLiveFeedRoom.length) {
      await Promise.all(
        onlineParentsNotInLiveFeedRoom.map(parentId =>
          sendNotificationToUser(parentId, title, msg + ": " + post._id)
        )
      );
    }
  }
};

exports.sendAdminActivityUpdatesToTeachers = async (activity) => {
  const io = getIO();

  io.to("adminUpdatesForPostActivity").emit("activityUpdates", {
    activity,
  });
}

// exports.sendCommentNotification = async ({ post, authorType, comment }) => {
//   // Populate necessary fields

//   const io = getIO();
//   post = await post.populate([{path: 'children'}]);

//   const teacherId = post.author._id.toString();
//   let parentIds = new Set();

//   // Get users in the specific post room (room = post._id)
//   const postRoom = io.sockets.adapter.rooms.get(post._id.toString()) || new Set();
//   const connectedUsers = new Set(postRoom);

//   if (post.type === "CHILD") {
//     // Get parents from children (removing duplicates)
//     post.children.forEach((child) => parentIds.add(child.parent.toString()));
//   } else if (post.type === "CLASS") {
//     // Fetch all children in the classroom & extract parents
//     const childrenInClass = await Children.find({ classroom: post.classroom });
//     childrenInClass.forEach((child) => parentIds.add(child.parent.toString()));
//   }

//   if (authorType === "parent") {
//     // Notify teacher ONLY IF they are not in the post room
//     if (!connectedUsers.has(teacherId)) {
//       io.to(teacherId).emit("newComment", {
//         comment,
//       });

//       try {
//         const notification = new Notification({
//           title: "New Comment",
//           content: `A parent commented on post ${post._id}`,
//           assignee: teacherId,
//           type: "NOTIFICATION",
//         });
//         await notification.save();

//         console.log("New comment notification saved to the database.");
//       } catch (error) {
//         console.error("Error saving new comment notification:", error);
//       }
//     }
//   } else if (authorType === "teacher") {
//     // Filter only offline parents
//     const offlineParents = [...parentIds].filter((parentId) => !connectedUsers.has(parentId));

//     if (offlineParents.length) {
//       offlineParents.forEach(async (parentId) => {
//         io.to(parentId).emit("newComment", {
//           comment,
//         });
//         try {
//           const notification = new Notification({
//             title: "New Comment",
//             content: `The teacher commented on post ${post._id}`,
//             assignee: parentId,
//             type: "NOTIFICATION",
//           });
//           await notification.save();
//           console.log("New comment notification saved to the database.");
//         } catch (error) {
//           console.error("Error saving new comment notification:", error);
//         }
//       });
//     }
//   }
// };

// exports.sendChildAssignmentNotification = async (parentId, childData) => {
//   const roomName = parentId.toString(); // Assuming the room name is the same as the parent's ID
//   const io = getIO();
//   // Get the socket associated with the room
//   const parentSocket = io.sockets.in(roomName);

//   // Check if the socket exists
//   if (parentSocket) {
//     // Emit a custom event for the child assignment notification
//     parentSocket.emit("childAssignment", { childData, isRead: false });

//     // Save the notification to the database
//     try {
//       const notification = new Notification({
//         title: "Child Assigned",
//         content: `A child has been assigned to you: ${JSON.stringify(childData)}`,
//         assignee: parentId,
//         type: "NOTIFICATION",
//       });
//       await notification.save();
//       console.log("Child assignment notification saved to the database.");
//     } catch (error) {
//       console.error("Error saving child assignment notification:", error);
//     }
//   } else {
//     console.log(`Parent with ID ${parentId} is not connected.`);
//   }
// };

// exports.childCheckinNotification = async (recieverId,childData,attendance) => {
//   const roomName = recieverId.toString(); // Assuming the room name is the same as the parent's ID
//   const io = getIO();
//   // Get the socket associated with the room
//   const userSocket = io.sockets.in(roomName);

//   // Check if the socket exists
//   if (userSocket) {
//     // Emit a custom event for the child assignment notification
//     userSocket.emit("childCheckIn", { childData, attendance });

//     // Save the notification to the database
//     try {
//       const notification = new Notification({
//         title: "Child Checked In",
//         content: ` ${childData.firstName + " " + childData.lastName} has been checked in.`,
//         assignee: recieverId,
//         type: "NOTIFICATION",
//       });
//       await notification.save();
//       console.log("Child checkIn notification saved to the database.");
//     } catch (error) {
//       console.error("Error saving child assignment notification:", error);
//     }
//   } else {
//     console.log(`Parent with ID ${parentId} is not connected.`);
//   }
// };

// exports.childLeaveNotification = async (recieverId,childData,attendance) => {
//   const roomName = recieverId.toString(); // Assuming the room name is the same as the parent's ID
//   const io = getIO();
//   // Get the socket associated with the room
//   const userSocket = io.sockets.in(roomName);

//   // Check if the socket exists
//   if (userSocket) {
//     // Emit a custom event for the child assignment notification
//     userSocket.emit("childLeave", { childData, attendance });

//     // Save the notification to the database
//     try {
//       const notification = new Notification({
//         title: "Child Leave",
//         content: ` ${childData.firstName + " " + childData.lastName} has taken a leave.`,
//         assignee: recieverId,
//         type: "NOTIFICATION",
//       });
//       await notification.save();
//       console.log("Child leave notification saved to the database.");
//     } catch (error) {
//       console.error("Error saving child leave notification:", error);
//     }
//   } else {
//     console.log(`Parent with ID ${parentId} is not connected.`);
//   }
// }



