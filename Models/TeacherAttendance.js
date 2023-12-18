const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const teacherAttendanceSchema = new Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "teacher",
    },
    checkInDate: {
      type: Date,
      default: new Date(),
    },
    checkInTime: {
      type: Date,
      default: new Date(),
    },
    checkOutTime: {
      type: Date,
      default: new Date(),
    },
    leaveReason: {
      type: String,
      default: "",
    },
    sickDescription: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LEAVE", "SICK", "HOLIDAY"],
      default: "PRESENT",
    },
  },
  { timestamps: true }
);

teacherAttendanceSchema.plugin(mongoosePaginate);
teacherAttendanceSchema.plugin(aggregatePaginate);
teacherAttendanceSchema.index({ teacher: 1, checkInDate: 1 });
teacherAttendanceSchema.index({ teacher: 1 });
teacherAttendanceSchema.index({ checkInDate: 1 });
module.exports = mongoose.model("teacherAttendance", teacherAttendanceSchema);
