const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      default: "",
    },
    chargeId: {
      type: String,
      required: false,
      default: "",
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lesson",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
    },
    payee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    type: {
      type: String,
      enum: ["LESSON", "COURSE"],
      default: "LESSON",
    },
  },
  { timestamps: true }
);

paymentSchema.plugin(mongoosePaginate);
paymentSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("payment", paymentSchema);
