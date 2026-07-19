//Models
const Coach = require("../../Models/Teacher");
const Rates = require("../../Models/Rates");
const Commission = require("../../Models/Commission")
const fs = require("fs")

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { generateEmail } = require("../../Helpers/email");
const mongoose = require('mongoose')
const sanitizeUser = require("../../Helpers/sanitizeUser");
const {
  createResetToken,
  validateResetToken,
} = require("../../Helpers/verification");



//addComission
exports.setRates = async (req, res) => {
  const { coachId, hourlyRate,tutoringRate,coachingRate } = req.body;

  try {
    let coach = await Coach.findOne({_id:coachId});
    if(!coach){
      return res.json(ApiResponse({}, "Coach Not Found",false));
    }
    
    let rates = await Rates.findOne({ coach:coachId });

    if (rates) {
      rates.hourlyRate = hourlyRate ? hourlyRate : (rates.hourlyRate || 0) ;
      rates.tutoringRate = tutoringRate ? tutoringRate : (rates.tutoringRate || 0) ;
      rates.coachingRate = coachingRate ? coachingRate : (rates.coachingRate || 0) ;
    } else {
      // Create new rates if not found
      if( !hourlyRate || !tutoringRate || !coachingRate){
        return res.json(ApiResponse({}, "HourlyRates,tutoringRates & coachingRates are required",false));
      }
      rates = new Rates({ coach:coachId, hourlyRate,tutoringRate,coachingRate });
    }

    await rates.save();

    res.json(ApiResponse(rates, "Rates set successfully"));
  } catch (error) {
    res.json(ApiResponse({}, error.message, false));
  }
};



exports.getMyRates = async (req, res) => {
  const { id } = req.user;

  try {
    const isCoach = await Coach.exists({ _id: id });

    if (!isCoach) {
      return res.json(ApiResponse({}, "User is not a coach", false));
    }

    const rates = await Rates.findOne({ coach: id });
    if (!rates) {
      return res.json(ApiResponse({}, "Rates not set", false));
    }

    const commission = await Commission.findOne();

    const tutoringCommissionAmount = (rates.tutoringRate * commission?.tutoringCommission || 0) / 100;
    const coachingCommissionAmount = (rates.coachingRate * commission?.coachingCommission || 0) / 100;

    const totalTutoringRate = Math.floor(rates.tutoringRate + tutoringCommissionAmount);
    const totalCoachingRate = Math.floor(rates.coachingRate + coachingCommissionAmount);

    const response = {
      rates,
      totalTutoringRate,
      totalCoachingRate,
    };

    res.json(ApiResponse(response));
  } catch (error) {
    res.json(ApiResponse({}, error.message, false));
  }
};


exports.getCoachRates = async (req, res) => {
  const { id } = req.params;

  try {
    const isCoach = await Coach.exists({ _id: id });

    if (!isCoach) {
      return res.json(ApiResponse({}, "User is not a coach", false));
    }

    const rates = await Rates.findOne({ coach: id });
    if (!rates) {
      return res.json(ApiResponse({}, "Rates not set", false));
    }

    const commission = await Commission.findOne();

    const tutoringCommissionAmount = (rates.tutoringRate * commission?.tutoringCommission || 0) / 100;
    const coachingCommissionAmount = (rates.coachingRate * commission?.coachingCommission || 0) / 100;

    const totalTutoringRate = Math.floor(rates.tutoringRate + tutoringCommissionAmount);
    const totalCoachingRate = Math.floor(rates.coachingRate + coachingCommissionAmount);

    const response = {
      rates,
      totalTutoringRate,
      totalCoachingRate,
    };

    res.json(ApiResponse(response));
  } catch (error) {
    res.json(ApiResponse({}, error.message, false));
  }
};

