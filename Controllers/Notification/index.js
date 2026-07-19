//Models
const Coach = require("../../Models/Teacher");
const User = require("../../Models/User")
const Chat = require("../../Models/Chat")
const Notification = require("../../Models/Notification");
const {sendNotificationToUser, sendNotificationToAdmin} = require("../../Helpers/notification")
const mongoose = require("mongoose")
const moment = require("moment")
//Helpers
const { ApiResponse } = require("../../Helpers/index");

//libraries
const dayjs = require("dayjs");


exports.getAllNotifications = async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
  
      let { keyword, from, to,type,isRead } = req.query;
  
      let finalAggregate = [{
        $sort:{
          createdAt:-1
        }
      },{
        $match:{
          pushNotification:true
        }
      }];
  
        if (keyword) {
          const regex = new RegExp(keyword.toLowerCase(), "i");
          finalAggregate.push({
            $match: {
              $or: [
                { title: { $regex: regex } },
                { content: { $regex: regex } },
              ],
            },
          });
        }
        

        if (isRead) {
          finalAggregate.push({
            $match: {
              isRead: req.query.isRead,
            },
          });
        }
    
  
        if (type) {
          finalAggregate.push({
            $match: {
              type: req.query.type,
            },
          });
        }
    
        if (from) {
          finalAggregate.push({
            $match: {
              createdAt: {
                $gte: moment(from).startOf("day").toDate(),
              },
            },
          });
        }
    
        if (to) {
          finalAggregate.push({
            $match: {
              createdAt: {
                $lte: moment(to).endOf("day").toDate(),
              },
            },
          });
        }
  
      const myAggregate =
        finalAggregate.length > 0
          ? Notification.aggregate(finalAggregate)
          : Notification.aggregate([]);
  
      Notification.aggregatePaginate(myAggregate, { page, limit }).then((notifications) => {
        res.json(ApiResponse(notifications));
      });
    } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
    }
  };

  
exports.getAllMyNotifications = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let { keyword, from, to,type,status } = req.query;

    let finalAggregate = [{
      $sort:{
        createdAt:-1
      }
    }];

    finalAggregate.push(
      {
        $match: {
          assignee: new mongoose.Types.ObjectId(req.user._id),
        },
      },
    );


      if (keyword) {
        const regex = new RegExp(keyword.toLowerCase(), "i");
        finalAggregate.push({
          $match: {
            $or: [
              { title: { $regex: regex } },
              { content: { $regex: regex } },
            ],
          },
        });
      }
      

      if (status) {
        finalAggregate.push({
          $match: {
            isRead: req.query.status == "read" ? true : false,
          },
        });
      }
  

      if (type) {
        finalAggregate.push({
          $match: {
            type: req.query.type,
          },
        });
      }
  
      if (from) {
        finalAggregate.push({
          $match: {
            createdAt: {
              $gte: moment(from).startOf("day").toDate(),
            },
          },
        });
      }
  
      if (to) {
        finalAggregate.push({
          $match: {
            createdAt: {
              $lte: moment(to).endOf("day").toDate(),
            },
          },
        });
      }

    const myAggregate =
      finalAggregate.length > 0
        ? Notification.aggregate(finalAggregate)
        : Notification.aggregate([]);

    Notification.aggregatePaginate(myAggregate, { page, limit }).then((notifications) => {
      res.json(ApiResponse(notifications));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getAllAdminNotifications = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let { keyword, from, to,type,status } = req.query;

    let finalAggregate = [{
      $sort:{
        createdAt:-1
      }
    }];

    finalAggregate.push(
      {
        $match: {
          isAdmin: true,
        },
      },
    );


      if (keyword) {
        const regex = new RegExp(keyword.toLowerCase(), "i");
        finalAggregate.push({
          $match: {
            $or: [
              { title: { $regex: regex } },
              { content: { $regex: regex } },
            ],
          },
        });
      }
      

      if (status) {
        finalAggregate.push({
          $match: {
            isRead: req.query.status == "read" ? true : false,
          },
        });
      }
  

      if (type) {
        finalAggregate.push({
          $match: {
            type: req.query.type,
          },
        });
      }
  
      if (from) {
        finalAggregate.push({
          $match: {
            createdAt: {
              $gte: moment(from).startOf("day").toDate(),
            },
          },
        });
      }
  
      if (to) {
        finalAggregate.push({
          $match: {
            createdAt: {
              $lte: moment(to).endOf("day").toDate(),
            },
          },
        });
      }

    const myAggregate =
      finalAggregate.length > 0
        ? Notification.aggregate(finalAggregate)
        : Notification.aggregate([]);

    Notification.aggregatePaginate(myAggregate, { page, limit }).then((notifications) => {
      res.json(ApiResponse(notifications));
    });
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};



// Get notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.json(ApiResponse({}, "Notification not found", true));
    }

    return res.json(ApiResponse({ notification }, "", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


exports.getUnreadNotifications = async (req, res) => {
  try {
    let finalAggregate = [];

    finalAggregate.push(
      {
        $match: {
          assignee: new mongoose.Types.ObjectId(req.user._id),
          isRead: false, // Filter only unread notifications
        },
      },
    );

    const myAggregate =
      finalAggregate.length > 0
        ? Notification.aggregate(finalAggregate)
        : Notification.aggregate([]);

    const totalUnreadCount = await Notification.countDocuments({
      assignee: new mongoose.Types.ObjectId(req.user._id),
      isRead: false,
    });

    const notifications = await myAggregate
      .sort({ createdAt: -1 })
      .limit(3) // Limit to the top 5 notifications
      .exec();

    res.json(ApiResponse({ totalUnreadCount, notifications }));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.getUnreadAdminNotifications = async (req, res) => {
  try {
    let finalAggregate = [];

    finalAggregate.push(
      {
        $match: {
          isAdmin:true,
          isRead: false, // Filter only unread notifications
        },
      },
    );

    const myAggregate =
      finalAggregate.length > 0
        ? Notification.aggregate(finalAggregate)
        : Notification.aggregate([]);

    const totalUnreadCount = await Notification.countDocuments({
      isAdmin:true,
      isRead: false,
    });

    const notifications = await myAggregate
      .sort({ createdAt: -1 })
      .limit(3) // Limit to the top 5 notifications
      .exec();

    res.json(ApiResponse({ totalUnreadCount, notifications }));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, content } = req.body;

    let student = await User.findById(userId)
    let coach = await Coach.findById(userId)

    console.log(student,coach)

    if(!student && !coach){
        return res.json(ApiResponse({},  "User not Found",false));
    }


    const notificationType = "NOTIFICATION";

    // Call the sendNotificationToUser function without await
    sendNotificationToUser(userId, title, content, notificationType);

    // Respond to the user with a success message
    return res.json(ApiResponse({}, "Notification sent successfully", true));
  } catch (error) {
    // Handle errors and respond with an error message
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.sendNotificationToAdmin = async (req, res) => {
  try {
    const { title, content } = req.body;

    // Call the sendNotificationToUser function without await
    sendNotificationToAdmin(title, content);

    // Respond to the user with a success message
    return res.json(ApiResponse({}, "Notification sent successfully", true));
  } catch (error) {
    // Handle errors and respond with an error message
    return res.json(ApiResponse({}, error.message, false));
  }
};


exports.sendPushNotification = async (req, res) => {
  try {
    const { title, content,type,sendTo,selectedStudents,selectedTutors } = req.body;

    if(sendTo == "allUsers"){
      let students = await User.find()
      students.filter(item => item.status == "ACTIVE").map(item => {
        sendNotificationToUser(item._id,title, content, type);
      })

      let tutors = await Coach.find()
      tutors.filter(item => item.status == "ACTIVE").map(item => {
        sendNotificationToUser(item._id,title, content, type);
      })
    }else if(sendTo == "allStudents"){
      let students = await User.find()
      students.filter(item => item.status == "ACTIVE").map(item => {
        sendNotificationToUser(item._id,title, content, type);
      })
    }else if(sendTo == "allTutors"){
      let tutors = await Coach.find()
      tutors.filter(item => item.status == "ACTIVE").map(item => {
        sendNotificationToUser(item._id,title, content, type);
      })
    }else if(sendTo == "selectStudents"){
      selectedStudents.map(item => {
        sendNotificationToUser(item,title, content, type);
      })
    }else if(sendTo == "selectTutors"){
      selectedTutors.map(item => {
        sendNotificationToUser(item,title, content, type);
      })
    }

    const notification = new Notification({
      title,
      content: content,
      sendTo: sendTo,
      type,
      pushNotification: true,
    });
    await notification.save();

    return res.json(ApiResponse({}, "Notification sent successfully", true));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


exports.toggleNotification = async (req, res) => {
  try {
   let notification = await Notification.findById(req.params.id)
    
    if(!notification){
        return res.json(ApiResponse({},"Notification not Found",false));
    }

    notification.isRead =  !notification.isRead;
    
    await notification.save()

      // Respond to the user with a success message
    return res.json(ApiResponse({}, "Notification Changed successfully", true));
  } catch (error) {
    // Handle errors and respond with an error message
    return res.json(ApiResponse({}, error.message, false));
  }
};
