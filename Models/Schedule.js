const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
});

const availabilitySchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    // Remove the unique option here
  },
  timeSlots: [timeSlotSchema],
});

const scheduleSchema = new Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coach",
      required: true,
    },
    availability: [availabilitySchema],
  },
  { timestamps: true }
);

scheduleSchema.plugin(mongoosePaginate);
scheduleSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("schedule", scheduleSchema);
