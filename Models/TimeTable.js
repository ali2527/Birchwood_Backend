const mongoose = require("mongoose");
const { createHmac } = require('node:crypto');
const mongoosePaginate = require('mongoose-paginate');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const { token } = require("morgan");
const { v4: uuidv4 } = require('uuid');
const {generateRandom6DigitID} = require("../Helpers")

const timeTableSchema = new Schema(
  {
    class:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "class",
    },
    date:{
      type: Date,
      required: true,
    },
    activities: [{
        startTime: {
          type: String, 
        },
        endTime: {
          type: String,
        },
        description: {
          type: String,
          required: false,
        },
        subject: {
            type: String,
            required: false,
          },
          meta: {
            type: String,
            required: false,
          },
      }],    
  },
  { timestamps: true }
);

timeTableSchema.plugin(mongoosePaginate);
timeTableSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("timetable", timeTableSchema);
