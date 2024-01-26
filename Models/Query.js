const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const querySchema = new Schema(
  {
    name: {
      type: String,
      required:true,
    },
    email: {
        type: String,
        required:true,
      },
      subject: {
        type: String,
        required:true,
      },
      message: {
        type: String,
        required:true,
      },
  },
  { timestamps: true }
);

querySchema.plugin(mongoosePaginate);
querySchema.plugin(aggregatePaginate);
module.exports = mongoose.model("query", querySchema);
