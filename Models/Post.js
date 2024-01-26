const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "teacher",
      required: true,
    },

    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "activity",
      required: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "children",
      required: false,
    },

    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "classroom",
      required: false,
    },
    type: {
      type: String,
      enum: ["CHILD", "CLASS"],
      default: "CHILD",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    images: [
      {
        type: String,
        required: false,
      },
    ],
    videos: [
      {
        type: String,
        required: false,
      },
    ],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "parent",
      },
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teacher",
      },
    ],
    loves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "parent",
      },
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "teacher",
      },
    ],
  },
  { timestamps: true }
);

postSchema.plugin(mongoosePaginate);
postSchema.plugin(aggregatePaginate);

module.exports = Post = mongoose.model("post", postSchema);
