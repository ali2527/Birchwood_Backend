const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const {generateRandom6DigitID} = require("../Helpers")
const Schema = mongoose.Schema;

const classSchema = new Schema(
  {
    classId: {
      type: String,
      unique: true,
      default: generateRandom6DigitID('CL'),
    },
    className: {
      type:String,
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
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
    }],
    status:{
        type:String,
        enum:["ACTIVE","INACTIVE"],
        default:"ACTIVE"
    }
  },
  { timestamps: true }
);

classSchema.plugin(mongoosePaginate);
classSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("class", classSchema);
