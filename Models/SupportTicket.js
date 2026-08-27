const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["GENERAL", "FEES", "HOMEWORK", "ATTENDANCE", "OTHER"],
      default: "GENERAL",
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      default: "NORMAL",
    },
    participantRole: {
      type: String,
      enum: ["TEACHER", "PARENT"],
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    participantName: {
      type: String,
      default: "",
    },
    relatedChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "children",
      default: null,
    },
    relatedClassroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "classroom",
      default: null,
    },
    createdByRole: {
      type: String,
      enum: ["ADMIN", "TEACHER", "PARENT"],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessagePreview: {
      type: String,
      default: "",
    },
    adminUnreadCount: {
      type: Number,
      default: 0,
    },
    participantUnreadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

supportTicketSchema.plugin(mongoosePaginate);
supportTicketSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("supportTicket", supportTicketSchema);
