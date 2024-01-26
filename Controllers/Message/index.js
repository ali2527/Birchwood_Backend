//Models
const Coach = require("../../Models/Teacher");
const User = require("../../Models/User")
const Chat = require("../../Models/Chat")
const Message = require("../../Models/Message");

//Helpers
const { ApiResponse } = require("../../Helpers/index");

//libraries
const dayjs = require("dayjs");


//create Chat
exports.createMessage = async (req, res) => {
  const { senderType,content,chatId } = req.body;
  try {

    let chat = await Chat.findById(chatId)

    if(!chat){
        return res
        .json(ApiResponse({},  "Chat not Found",false));
    }


   const message = new Message({
    senderType,
    content,
    sender:req.user._id,
    chat:chatId
    });

    await message.save();

    
    chat.latestMessage = message._id;
    await chat.save()


    return res.json(
        ApiResponse(
          { message },       
          "Message Created Successfully",
          true
        )
      );
  } catch (error) {
    return res.json(ApiResponse({}, error.message,false));
  }
};

exports.getChatMessages = async (req, res) => {
    const { chat } = req.params;
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10

    try {
        // Assuming 'Message' is the Mongoose model for messages
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: 'desc' }, // You can adjust the sorting as needed
            populate: 'sender',
            
             // Populate the sender field with user/coach info
        };

        const result = await Message.paginate({ chat }, options);

        return res.status(200).json(ApiResponse(result, 'Chat messages retrieved successfully', true));
    } catch (error) {
        return res.status(500).json(ApiResponse({}, error.message, false));
    }
};