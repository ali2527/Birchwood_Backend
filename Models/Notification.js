const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      required: false,
      default: "",
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    isAdmin:{
      type: Boolean,
      default: false,
    },
    pushNotification:{
      type:Boolean,
      default:false
    },
    sendTo:{
      type: String,
      required: false,
      default: "",
    },
    type: {
      type: String,
      enum: ["ALERT", "ANNOUNCEMENT", "NOTIFICATION"],
      default: "NOTIFICATION",
    },
  },
  { timestamps: true }
);

notificationSchema.plugin(mongoosePaginate);
notificationSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("notification", notificationSchema);
