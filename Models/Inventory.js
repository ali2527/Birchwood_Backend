const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const { generateRandom6DigitID } = require("../Helpers");

const issuanceSchema = new Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    assignedToType: {
      type: String,
      enum: ["TEACHER", "CLASSROOM", "STAFF", "DEPARTMENT"],
      required: true,
    },
    assignedToId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    assignedToName: {
      type: String,
      default: "",
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const inventorySchema = new Schema(
  {
    sku: {
      type: String,
      unique: false,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    manufacturer: {
      type: String,
      required: false,
    },
    purchaseDate: {
      type: Date,
      dafault: new Date(),
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    lastAuditDate: {
      type: Date,
      dafault: new Date(),
    },
    notes: {
      type: String,
      required: false,
    },
    storageLocation: {
      type: String,
      required: false,
    },
    issuances: {
      type: [issuanceSchema],
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    gallery: [
      {
        type: String,
        required: false,
      },
    ],
  },
  { timestamps: true }
);

inventorySchema.plugin(mongoosePaginate);
inventorySchema.plugin(aggregatePaginate);
module.exports = mongoose.model("inventory", inventorySchema);
