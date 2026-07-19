const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coach",
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lesson",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

reviewSchema.plugin(mongoosePaginate);
reviewSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("review", reviewSchema);
