const Reset = require("../Models/Reset");

const RESET_TTL_MS = 30 * 60 * 1000;

exports.createResetToken = async (email, code) => {
  const token = await Reset.findOne({ email });
  if (token) await Reset.deleteOne({ email });
  const newToken = new Reset({
    email,
    code,
  });
  await newToken.save();
};

exports.validateResetToken = async (code, email) => {
  const data = await Reset.findOne({ code, email });
  if (!data) return false;
  const age = Date.now() - new Date(data.createdAt).getTime();
  if (age > RESET_TTL_MS) {
    await Reset.deleteOne({ _id: data._id });
    return false;
  }
  return true;
};
