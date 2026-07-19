const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const courseSchema = new Schema(
  {
    courseCode: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    duration: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    category:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    price: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: false,
    },
    author:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "coach",
    },
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "lecture",
      },
    ],
    quizes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "quiz",
      },
    ],
    features: [
      {
        type: String,
        required: false,
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

courseSchema.plugin(mongoosePaginate);
courseSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("course", courseSchema);
