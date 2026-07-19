const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const serviceSchema = new Schema(
  {
    title: {
      type: String,
      required:true,
      default: "",
    },
    description: {
        type: String,
        required:false,
        default: "",
      },
      image: {
        type: String,
        required:false,
      },
    status:{
        type:String,
        enum:["ACTIVE","INACTIVE"],
        default:"ACTIVE"
    }
  },
  { timestamps: true }
);

serviceSchema.plugin(mongoosePaginate);
serviceSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("service", serviceSchema);
