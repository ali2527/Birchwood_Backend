const mongoose = require("mongoose");
const { createHmac } = require('node:crypto');
const mongoosePaginate = require('mongoose-paginate');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const { token } = require("morgan");
const { v4: uuidv4 } = require('uuid');
const {generateRandom6DigitID} = require("../Helpers")

const inventorySchema = new Schema(
  {
    sku: {
      type: String,
      unique: true,
      default: generateRandom6DigitID('I'),
    },
    title:{
      type: String,
      required:true
    },
    description:{
      type: String,
      required:true
    },
    quantity: {
      type: Number,
      required: true,
    },

    category:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

inventorySchema.plugin(mongoosePaginate);
inventorySchema.plugin(aggregatePaginate);
module.exports = mongoose.model("inventory", inventorySchema);
