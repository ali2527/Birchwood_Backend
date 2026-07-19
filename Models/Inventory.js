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
      unique: false,
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
    manufacturer:{
      type: String,
      required:false
    },
    purchaseDate:{
      type: Date,
      dafault:new Date()
    },
    unitPrice:{
      type:Number,
      default:0
    },
    lastAuditDate:{
      type: Date,
      dafault:new Date()
    },
    notes:{
      type: String,
      required:false
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
    gallery:[
      {
        type: String,
        required:false,
    }
    ]
  },
  { timestamps: true }
);

inventorySchema.plugin(mongoosePaginate);
inventorySchema.plugin(aggregatePaginate);
module.exports = mongoose.model("inventory", inventorySchema);
