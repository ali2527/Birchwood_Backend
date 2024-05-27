const mongoose = require("mongoose");
const { createHmac } = require('node:crypto');
const mongoosePaginate = require('mongoose-paginate');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const { token } = require("morgan");
const { v4: uuidv4 } = require('uuid');
const {generateRandom6DigitID} = require("../Helpers")

const holidaySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    date:{
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

holidaySchema.plugin(mongoosePaginate);
holidaySchema.plugin(aggregatePaginate);
module.exports = mongoose.model("holiday", holidaySchema);
