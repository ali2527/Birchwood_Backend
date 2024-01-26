const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const responseSchema = new Schema({
  question: {
    type: String,
    required: false,
  },
  answer: {
    type: String,
    required: false,
  },
});

const attemptSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quiz",
    },
    score: {
      type: Number,
      required: true,
    },
    responses: [responseSchema],
    status: {
      type: String,
      enum: ["PENDING", "PASSED", "FAILED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

attemptSchema.plugin(mongoosePaginate);
attemptSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("attempt", attemptSchema);
