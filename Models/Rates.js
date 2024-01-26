const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const rateSchema = new Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coach",
    },
    hourlyRate: {
        type: Number,
        required: false,
      },
    tutoringRate: {
      type: Number,
      required: false,
    },
    coachingRate: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("rate", rateSchema);
