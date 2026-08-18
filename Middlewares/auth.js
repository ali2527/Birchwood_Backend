const jwt = require("jsonwebtoken");
const Parent = require("../Models/Parent");
const Teacher = require("../Models/Teacher");
const { ApiResponse } = require("../Helpers");
require("dotenv").config();

const getToken = (req) =>
  req.headers.authorization || req.body.token || req.query.token;

const verifyToken = (token) =>
  jwt.verify(String(token).replace("Bearer ", ""), process.env.JWT_SECRET);

exports.authenticatedRoute = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(403).json(ApiResponse({}, "Access Forbidden", false));
  }

  try {
    const decoded = verifyToken(token);
    const parent = await Parent.findById(decoded._id);
    const teacher = await Teacher.findById(decoded._id);

    if (!parent && !teacher) {
      return res.status(401).json(ApiResponse({}, "Unauthorized Access", false));
    }

    req.user = parent || teacher;
    req.isAdmin = Boolean(parent && parent.isAdmin);
    req.userRole = req.isAdmin ? "admin" : parent ? "parent" : "teacher";
    next();
  } catch (err) {
    return res
      .status(401)
      .json(ApiResponse({}, "Session expired, Please sign in again", false));
  }
};

exports.adminRoute = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(403).json(ApiResponse({}, "Access Forbidden", false));
  }

  try {
    const decoded = verifyToken(token);
    const user = await Parent.findById(decoded._id);

    if (!user || !user.isAdmin) {
      return res.status(401).json(ApiResponse({}, "Unauthorized Access", false));
    }

    req.user = user;
    req.isAdmin = true;
    req.userRole = "admin";
    next();
  } catch (err) {
    return res
      .status(401)
      .json(ApiResponse({}, "Invalid Token, Please sign in again", false));
  }
};
