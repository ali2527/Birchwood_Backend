const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");

const supportMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supportTicket",
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ["ADMIN", "TEACHER", "PARENT"],
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderName: {
      type: String,
      default: "",
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

supportMessageSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("supportMessage", supportMessageSchema);
