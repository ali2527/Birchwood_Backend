const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const {generateRandom6DigitID} = require("../Helpers")
const Schema = mongoose.Schema;

const classroomSchema = new Schema(
  {
    classroomId: {
      type: String,
      unique: false,
    },
    classroomName: {
      type:String,
      default: true,
    }, 
    classroomGrade: {
      type:String,
      default: true,
    },
    classroomBatch: {
      type:Number,
      default: true,
    },
    description: {
      type: String,
      required: false,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "teacher",
    },
    status:{
        type:String,
        enum:["ACTIVE","INACTIVE"],
        default:"ACTIVE"
    }
  },
  { timestamps: true }
);

classroomSchema.plugin(mongoosePaginate);
classroomSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("classroom", classroomSchema);
