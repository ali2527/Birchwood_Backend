const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
    author: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

commentSchema.plugin(mongoosePaginate);
commentSchema.plugin(aggregatePaginate);

module.exports = Post = mongoose.model("comment", commentSchema);
