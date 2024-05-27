const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const attendanceSchema = new Schema(
  {
    children: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "children",
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "classroom",
    },
    checkIn: {
      type: Date,
      default: new Date(),
    },
    leaveReason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LEAVE", "HOLIDAY"],
      default: "ABSENT",
    },
  },
  { timestamps: true }
);

attendanceSchema.plugin(mongoosePaginate);
attendanceSchema.plugin(aggregatePaginate);
attendanceSchema.index({ children: 1, classroom: 1, checkInDate: 1 });
attendanceSchema.index({ children: 1 });
attendanceSchema.index({ classroom: 1 });
attendanceSchema.index({ checkInDate: 1 });
module.exports = mongoose.model("attendance", attendanceSchema);
