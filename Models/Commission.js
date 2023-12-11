const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema({
  tutoringCommission: {
    type: Number,
    required: false,
    default:0,
  },
  coachingCommission: {
    type: Number,
    required: false,
    default:0
  },
});

const Commission = mongoose.model("commission", commissionSchema);

module.exports = Commission;