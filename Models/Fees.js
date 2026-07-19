const mongoose = require("mongoose");
const { createHmac } = require("node:crypto");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const { token } = require("morgan");
const { v4: uuidv4 } = require("uuid");
const { generateRandom6DigitID } = require("../Helpers");

const feeSchema = new Schema(
  {
    receiptNo: {
      type: String,
      unique: false,
    },
    children: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "children",
    },
    amount: {
      type: Number,
      default: 0,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      default: new Date(),
    },
    paymentDate: {
      type: Date,
      default: new Date(),
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

feeSchema.plugin(mongoosePaginate);
feeSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("fee", feeSchema);
