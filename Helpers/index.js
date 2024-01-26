const { v1: uuidv1 } = require('uuid');
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv")
dotenv.config();

//default api response format
exports.ApiResponse = (data = {}, message = "", status = true) => {
  return {
    status: status,
    message: message,
    data: data,
  };
};

//generate password based on caps, smalls and numbers.
exports.generateString = (length, onlyCaps = false, onlyNumbers = false) => {
  length = length ? length : 8;
  let charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let retVal = "";
  if (onlyCaps) {
    charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }
  if (onlyNumbers) {
    charset = "1234567890";
  }
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};


exports.generateRandom6DigitID = (prefix) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomID = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomID += characters[randomIndex];
  }
  if(prefix){
    return prefix + randomID;
  }
  return randomID;
}

//check file extention
exports.checkFileExtention = (file, extentions) => {
  const type = file.originalFilename.split(".").pop() || "png";
  const validTypes = extentions ? extentions : ["jpg", "jpeg", "png"];
  if (validTypes.indexOf(type) === -1) {
    return false;
  }
  return true;
};


exports.generateToken = (user) => {
  const token = jwt.sign(
    {
      _id: user._id,  
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return token;
};


exports.validateToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.json(ApiResponse({}, { error: "Invalid Token" }, false));
  }
};

exports.verifyToken = (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
    if (err) {
      res.json(ApiResponse({}, { error: "Invalid Token" }, false));
    } else {
      req.user = authData;
      next();
    }
  });
};
