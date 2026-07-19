//Models
const User = require("../../Models/User");
const Query = require("../../Models/Query");
const fs = require("fs")
const moment = require("moment")
//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");



//addQuery
exports.addQuery = async (req, res) => {
    const { name, email, subject, message } = req.body;
  
    try {
      const query = new Query({
        name,
        email,
        subject,
        message,
      });
  
      await query.save();
  
      return res.status(200).json(
        ApiResponse(
          { query },
          
          "Query Created Successfully",
          true
        )
      );
    } catch (error) {
      return res.json(
        ApiResponse(
          {},
          errorHandler(error) ? errorHandler(error) : error.message,
          false
        )
      );
    }
  };

exports.getAllQueries  = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let finalAggregate = [];

    if (req.query) {
      if (req.query.keyword) {
        finalAggregate.push({
          $match: {
            $or: [
              {
                name: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },
              {
                email: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },
              {
                subject: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },
              {
                message: {
                  $regex: ".*" + req.query.keyword.toLowerCase() + ".*",
                  $options: "i",
                },
              },
            ],
          },
        });
      }

      if (req.query.from) {
        finalAggregate.push({
          $match: {
            createdAt: {
              $gte: moment(req.query.from).startOf("day").toDate(),
            },
          },
        });
      }
  
      if (req.query.to) {
        finalAggregate.push({
          $match: {
            createdAt: {
              $lte: moment(req.query.to).endOf("day").toDate(),
            },
          },
        });
      }
    }

    const myAggregate = 
      finalAggregate.length > 0
        ? Query.aggregate(finalAggregate)
        : Query.aggregate([]);

    Query.aggregatePaginate(myAggregate, { page, limit }).then(
      (queries) => {
        res.json(ApiResponse(queries));
      }
    );
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

// Get query by ID
exports.getQueryById = async (req, res) => {
    try {
      const query = await Query.findById(req.params.id);
  
      if (!query) {
        return res.json(ApiResponse({}, "Query not found", true));
      }
  
      return res.json(ApiResponse({ query }, "", true));
    } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
    }
  };
  
  // Delete a query
  exports.deleteQuery = async (req, res) => {
    try {
      const query = await Query.findByIdAndRemove(req.params.id);
  
      if (!query) {
        return res.json(ApiResponse({}, "Query not found", false));
      }
  
      return res.json(ApiResponse({}, "Query Deleted Successfully", true));
    } catch (error) {
      return res.json(
        ApiResponse(
          {},
          errorHandler(error) ? errorHandler(error) : error.message,
          false
        )
      );
    }
  };
