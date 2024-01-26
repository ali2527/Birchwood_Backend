//Models
const Coach = require("../../Models/Teacher");
const User = require("../../Models/User")
const Chat = require("../../Models/Chat")

//Helpers
const { ApiResponse } = require("../../Helpers/index");

//libraries
const dayjs = require("dayjs");
const { default: mongoose } = require("mongoose");


//create Chat
exports.createChat = async (req, res) => {
  const { student,coach } = req.body;
  try {

    let user = await User.findById(student)

    if(!user){
        return res
        .status(400)
        .json(ApiResponse({},  "Student not Found",false));
    }


    let _coach = await Coach.findById(coach)

    if(!_coach){
        return res.json(ApiResponse({},  "Coach not Found",false));
    }


    let chat = await Chat.findOne({ student,coach });

    if (chat) {
      return res.json(ApiResponse(chat, "Chat Between these Two users already exists", true));
    }

    chat = new Chat({
      student,
      coach,
      status:"ACTIVE"
    });

    await chat.save();

    return res
      .status(200)
      .json(
        ApiResponse(
          { chat },
       
          "Chat Created Successfully",
          true
        )
      );
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message,false));
  }
};

//get all My chats
exports.getMyChats = async (req, res) => {
    const { type,keyword } = req.query;
    try {

      let finalAggregate = []


        if(type == "student"){

          finalAggregate.push({
            $match: {student: new mongoose.Types.ObjectId(req.user._id)}
          },
          {
            $lookup: {
              from: "coaches",
              localField: "coach",
              foreignField: "_id",
              as: "coach",
            },
          },{
            $unwind:"$coach"
          })

          if (keyword) {
            finalAggregate.push({
              $match: {
                $or: [
                  {
                    "coach.firstName": {
                      $regex: ".*" + keyword.toLowerCase() + ".*",
                      $options: "i",
                    },
                  },
                  {
                    "coach.lastName": {
                      $regex: ".*" + keyword.toLowerCase() + ".*",
                      $options: "i",
                    },
                  },
                ],
              },
            });
          }
        }else{

          finalAggregate.push({
            $match: {coach: new mongoose.Types.ObjectId(req.user._id)}
          },
          {
            $lookup: {
              from: "users",
              localField: "student",
              foreignField: "_id",
              as: "student",
            },
          },{
            $unwind:"$student"
          })

          if (keyword) {
            finalAggregate.push({
              $match: {
                $or: [
                  {
                    "student.firstName": {
                      $regex: ".*" + keyword.toLowerCase() + ".*",
                      $options: "i",
                    },
                  },
                  {
                    "student.lastName": {
                      $regex: ".*" + keyword.toLowerCase() + ".*",
                      $options: "i",
                    },
                  },
                ],
              },
            });
          }
        }

        finalAggregate.push({
          $lookup: {
            from: "messages",
            localField: "latestMessage",
            foreignField: "_id",
            as: "latestMessage",
          },
        });
        
        finalAggregate.push({
          $unwind: {
            path: "$latestMessage",
            preserveNullAndEmptyArrays: true, // This will include documents without a latestMessage
          },
        });
       



    
        const myAggregate =
      finalAggregate.length > 0 ? Chat.aggregate(finalAggregate) : Chat.aggregate([]);

      const chats = await Chat.aggregatePaginate(myAggregate,{page:"1",limit:"100"});

      res.json(ApiResponse(chats));

    } catch (error) {
      return res.status(500).json(ApiResponse({}, error.message,false));
    }
  };
