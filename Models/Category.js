const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    
    title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
      },
  },
  { timestamps: true }
);

categorySchema.plugin(mongoosePaginate);
categorySchema.plugin(aggregatePaginate);
module.exports = mongoose.model("category", categorySchema);
