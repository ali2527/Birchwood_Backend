//Models
const User = require("../../Models/User");
const Comission = require("../../Models/Commission");
const fs = require("fs")

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



//addComission
exports.addComission = async (req, res) => {
    const { tutoringCommission, coachingCommission } = req.body;

    try {
      let comission = await Comission.findOne();
  
      if (!comission) {
        comission = new Comission({
          tutoringCommission,
          coachingCommission,
        });
      } else {
        comission.tutoringCommission = tutoringCommission;
        comission.coachingCommission = coachingCommission;
      }
  
      await comission.save();
  
      return res.status(200).json(
        ApiResponse(
          { comission },
          "Comission Created Successfully",
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


  exports.getComission = async (req, res) => {
    try {
      const commissions = await Comission.findOne();
      res.json(ApiResponse(commissions));
    } catch (error) {
      return res.json(ApiResponse({}, error.message, false));
    }
  };
