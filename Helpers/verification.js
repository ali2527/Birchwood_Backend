const Reset = require("../Models/Reset");

exports.createResetToken = async (email, code) => {
    const token = await Reset.findOne({ email });
    if (token) await Reset.deleteOne({ email });
    const newToken = new Reset({
      email,
      code,
    });
    await newToken.save();
  };


exports.validateResetToken = async (code, email) =>{
  
  let data = await Reset.findOne({ code:code, email:email });

  if(!data) return false;
  return true;
}