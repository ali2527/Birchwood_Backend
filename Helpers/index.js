const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.ApiResponse = (data = {}, message = "", status = true) => {
  return {
    status: status,
    message: message,
    data: data,
  };
};

exports.pick = (obj = {}, keys = []) => {
  const out = {};
  keys.forEach((key) => {
    if (obj[key] !== undefined) {
      out[key] = obj[key];
    }
  });
  return out;
};

exports.generateString = (length, onlyCaps = false, onlyNumbers = false) => {
  length = length ? length : 8;
  let charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  if (onlyCaps) {
    charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }
  if (onlyNumbers) {
    charset = "1234567890";
  }
  let retVal = "";
  for (let i = 0; i < length; ++i) {
    retVal += charset.charAt(crypto.randomInt(0, charset.length));
  }
  return retVal;
};

exports.generateRandom6DigitID = (prefix) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomID = "";
  for (let i = 0; i < 6; i++) {
    randomID += characters.charAt(crypto.randomInt(0, characters.length));
  }
  if (prefix) {
    return prefix + randomID;
  }
  return randomID;
};

exports.checkFileExtention = (file, extentions) => {
  const type = file.originalFilename.split(".").pop() || "png";
  const validTypes = extentions ? extentions : ["jpg", "jpeg", "png"];
  if (validTypes.indexOf(type) === -1) {
    return false;
  }
  return true;
};

const ADMIN_TOKEN_TYPE = "admin";
const APP_TOKEN_TYPE = "user";

const getAdminSecret = () =>
  process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET;

exports.generateToken = (user) => {
  const token = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: "user",
      tokenType: APP_TOKEN_TYPE,
      isAdmin: false,
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
  return token;
};

exports.generateAdminToken = (admin) => {
  const token = jwt.sign(
    {
      _id: admin._id,
      email: admin.email,
      role: "admin",
      tokenType: ADMIN_TOKEN_TYPE,
      isAdmin: true,
    },
    getAdminSecret(),
    {
      expiresIn: "12h",
      issuer: "birchwood-admin",
      audience: "admin-api",
    }
  );
  return token;
};

exports.verifyAdminToken = (token) =>
  jwt.verify(String(token).replace("Bearer ", ""), getAdminSecret(), {
    issuer: "birchwood-admin",
    audience: "admin-api",
  });

exports.ADMIN_TOKEN_TYPE = ADMIN_TOKEN_TYPE;

exports.validateToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.json(exports.ApiResponse({}, { error: "Invalid Token" }, false));
  }
};

exports.verifyToken = (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
    if (err) {
      res.json(exports.ApiResponse({}, { error: "Invalid Token" }, false));
    } else {
      req.user = authData;
      next();
    }
  });
};
