const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const lectureSchema = new Schema(
  {
    lectureNo: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    course:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

lectureSchema.plugin(mongoosePaginate);
lectureSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("lecture", lectureSchema);
