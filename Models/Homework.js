const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;


const homeworkSchema = new Schema(
  {
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "children",
      },
    children: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "children",
    },
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "classroom",
        required: false,
      },
    assignDate: {
        type: Date,
        default: new Date(),
      },
    dueDate: {
      type: Date,
      default: new Date(),
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
      },
      assignee: {
        type: String,
        enum: ["CLASS","CHILD"],
        default: "CHILD",
      },
      type: {
        type: String,
        enum: ["HOMEWORK","NOTICE","WARNING"],
        default: "HOMEWORK",
      },
  },
  { timestamps: true }
);

homeworkSchema.plugin(mongoosePaginate);
homeworkSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("homework", homeworkSchema);
