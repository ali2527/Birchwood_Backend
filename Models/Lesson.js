const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const {generateRandom6DigitID} = require("../Helpers")
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;



const lessonSchema = new Schema(
  {
    lessonId: {
      type: String,
      unique: false,
      default: generateRandom6DigitID("L"),
    },
    noOfLesson: {
      type: Number,
      required: false,
    },
    lessonType: {
      type: String,
      enum: ["COACHING", "TUTORING"],
      default: "COACHING",
    },
    subject:{
      type: String,
      required:true,
    },
    lessonDate: {
      type: Date,
      required: true,
      default: new Date(),
    },
    zoomUrl:{
      type: String,
      required:false,
    },
    meetingId:{
      type: String,
      required:false,
    },
    passcode:{
      type: String,
      required:false,
    },
    slots:[
      {
        lessonStartTime: {
          type: Date,
          required: true,
          default: new Date(),
        },
        lessonEndTime: {
          type: Date,
          required: true,
          default: new Date(),
        },
      }
    ],
    charges: {
      type: Number,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    isPaid:{
      type:Boolean,
      default:false,
    },
    isReviewed:{
      type:Boolean,
      default:false,
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coach",
    },
    status: {
      type: String,
      enum: ["PENDING","UPCOMING", "LIVE", "COMPLETED","REJECTED","MISSED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

lessonSchema.plugin(mongoosePaginate);
lessonSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("lesson", lessonSchema);
