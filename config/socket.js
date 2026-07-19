const socketIO = require("socket.io");
const User = require("../Models/User")
const Coach = require("../Models/Teacher");
const Teacher = require("../Models/Teacher");
const Parent = require("../Models/Parent");


let io; // Declare io as a global variable

function initializeWebSocket(server) {
  io = socketIO(server, {
    pingTimeout: 60000,
    cors: true,
    origin: ["*"],
  });

  io.on(
    "connection",
    (socket) => {
      console.log("Connected to socket.io");
  
      socket.on("setup", (userData) => {
        socket.join(userData._id);
        console.log("User Joined Room:", userData._id);
        socket.emit("connected");
      });

      socket.on("setupAdmin", (userData) => {
        socket.join("admin");
        console.log("Admin Joined Room");
        socket.emit("connected");
      });
  
      socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User Joined Room: " + room);
      });
      // socket.on("typing", (room) => socket.in(room).emit("typing"));
      // socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  
      socket.on("new message", async (newMessageRecieved) => {
        var chat = newMessageRecieved.chatId;
  
        if (newMessageRecieved.senderType == "teacher") {
          newMessageRecieved.sender = await Teacher.findById(
            newMessageRecieved.sender
          );
          newMessageRecieved.reciever = await Parent.findById(
            newMessageRecieved.reciever
          );
        } else {
          newMessageRecieved.sender = await Parent.findById(
            newMessageRecieved.sender
          );
          newMessageRecieved.reciever = await Teacher.findById(
            newMessageRecieved.reciever
          );
        }
  
        console.log(newMessageRecieved);
  
        if (!newMessageRecieved.reciever){
          return console.log("newMessageRecieved.reciever not defined");
        }
  
        socket.in(newMessageRecieved.reciever._id.toString()).emit("message", newMessageRecieved);
      });


      // SOCKET FOR ACTIVITY
      socket.on("adminUpdatesForPostActivity", () => {
        socket.join("adminUpdatesForPostActivity");
        console.log(`User Joined admin activity updates`);
      })

      socket.on("leaveAdminUpdatesForPostActivity", () => {
        socket.leave("adminUpdatesForPostActivity");
        console.log(`User left admin activity updates`);
      })
        
      // SOCKET FOR LIVE POST FEED (LIKE, UNLINE, LOVE AND UNLOVE)
      socket.on("livePostFeed", () => {
        socket.join("livePostFeed");
        console.log(`User Joined live post feed`);
      });

      socket.on("leaveLivePostFeed", () => {
        socket.leave("livePostFeed");
        console.log(`User left live post feed`);
      });
 
      // SOCKETS FOR POST COMMENTS
      socket.on("joinPost", (postId) => {
        socket.join(postId);
        console.log(`User joined post room: ${postId}`);
      });

      socket.on("leavePost", (postId) => {
        socket.leave(postId);
        console.log(`User left post room: ${postId}`);
      });


      //   // socket.off("setup", () => {
      //   //   socket.leave(userData._id);
      //   // });
  
      socket.on("disconnect", () => {
        console.log("User Disconnected");
      });
    },
    []
  );
  
}

module.exports = {
  initializeWebSocket,
  getIO: () => io, // Export a function to get the io instance
};