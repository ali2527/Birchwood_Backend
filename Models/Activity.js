const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const activitySchema = new Schema(
  {
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    image: {
        type: String,
        default: "",
      },
      
    status: {
      type: String,
      enum: ["ACTIVE","INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

activitySchema.plugin(mongoosePaginate);
activitySchema.plugin(aggregatePaginate);
module.exports = mongoose.model("activity", activitySchema);
