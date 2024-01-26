const mongoose = require("mongoose");
const { createHmac } = require('node:crypto');
const mongoosePaginate = require('mongoose-paginate');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const { token } = require("morgan");
const { v4: uuidv4 } = require('uuid');
const {generateRandom6DigitID} = require("../Helpers")

const childSchema = new Schema(
  {
    rollNumber:{
      type: String,
      required:true
    },
    term:{
      type: String,
      required:true
    },
    firstName: {
      type: String,
      minlength: 3,
      required: true,
    },
    lastName: {
      type: String,
      required: false,
    },
    age: {
      type: String,
      required: false,
    },
    birthday: {
      type: Date,
      required:false,
    },
    parent:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "parent",
    },
    homeNumber:{
      type: String,
      required: true,
    },
    allergies:{
      type: String,
      required: false,
    },
    fears:{
      type: String,
      required: false,
    },
    conditions:{
      type: String,
      required: false,
    },
    summary:{
      type: String,
      required: false,
    },
    classroom:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "classroom",
    },
   
    salt: String,
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

childSchema.plugin(mongoosePaginate);
childSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("children", childSchema);
