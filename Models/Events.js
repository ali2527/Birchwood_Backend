const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    title: {
        type: String,
        required:true,
        default: "",
    },
    description:{
        type: String,
        required:true,
        default: "",
    },
    date:{
        type: Date,
        required:true,
        default: new Date(),
    },
    location:{
        type: String,
        required:false,
    },
    address:{
        type: String,
        required:false,
    },
    classroom:{
        type: mongoose.Schema.Types.ObjectId,
      ref: "classroom",
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
      },
    image:{
        type: String,
        required:false,
    }
  },
  { timestamps: true }
);

eventSchema.plugin(mongoosePaginate);
eventSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("event", eventSchema);