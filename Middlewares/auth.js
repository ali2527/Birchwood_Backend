const jwt = require("jsonwebtoken");
const Parent = require("../Models/Parent")
const Teacher = require("../Models/Teacher")
const Admin = require("../Models/Admin")
const { isTokenBlacklisted } = require('../Helpers/tokenBlacklist.js');

const { ApiResponse } = require("../Helpers");
const { errorHandler } = require("../Helpers/errorHandler");
require("dotenv").config();

exports.authenticatedRoute = async (req, res, next) => {

  //extracting bearer token
  const token =
    req.body.token || req.query.token || req.headers["authorization"];

  if (!token) {
    return res.status(403).json(ApiResponse({}, "Access Forbidden", false))
  }
  try {
       const blacklisted = await isTokenBlacklisted(token);
       
    if (blacklisted) {
      return res.status(401).json(ApiResponse({}, "Unauthorized Access: Token blacklisted", false));
    }
    

    //verifying and decoding token
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);

    //finding user by id
    let parent = await Parent.findById(decoded._id);

    let teacher = await Teacher.findById(decoded._id)

    let admin = await Admin.findById(decoded._id)
   


    if (!parent && !teacher && !admin) {
      return res.status(401).json(ApiResponse({}, "Unauthorized Access", false))
    }
    req.user = parent || teacher || admin;
    next()
  } catch (err) {
      console.log(err)
    return res.status(401).send(ApiResponse({}, "Session expired, Please sign in again", false))
  }
  // return next();
};

exports.adminRoute = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["authorization"];

  if (!token) {
    return res.status(403).json(ApiResponse({}, "Access Forbidden", false))
  }
  try {
       const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json(ApiResponse({}, "Unauthorized Access: Token blacklisted", false));
    }
    
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    
    if (!decoded.isAdmin) {
      return res.status(401).json(ApiResponse({}, "Unauthorized Access", false))
    }
    let user = await Admin.findById(decoded._id)

    if (!user) {
      return res.json(ApiResponse({}, "User not found", false))
    }
    req.user = user;
    next()

  } catch (err) {
    console.log(err)
    return res.status(401).send(ApiResponse({}, "Invalid Token, Please sign in again", false));
  }
}