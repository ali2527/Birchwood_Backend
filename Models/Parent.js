const mongoose = require("mongoose");
const { createHmac } = require('node:crypto');
const mongoosePaginate = require('mongoose-paginate');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const { token } = require("morgan");
const { v4: uuidv4 } = require('uuid');
const {generateRandom6DigitID} = require("../Helpers")

const parentSchema = new Schema(
  {
    parentId: {
      type: String,
      unique: false,
    },
    fatherFirstName: {
      type: String,
      minlength: 3,
      required: true,
    },
    fatherLastName: {
      type: String,
      required: false,
    },
    motherFirstName: {
      type: String,
      minlength: 3,
      required: true,
    },
    motherLastName: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      minlength: 3,
      required: true,
      unique: true,
      dropDups: true,
    },
    phone:{
      type: String,
      required: true,
    },
    salt: String,
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    image: {
      type: String,
    },
    hashed_password: {
      type: String,
    },
    address: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    childrens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "children",
      },
    ],
  },
  { timestamps: true }
);

parentSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = uuidv4();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

  parentSchema.methods = {
    encryptPassword: function (password) {
      if (!password) return "";

         try {
        
        return crypto
          .createHmac("sha1", this.salt)
          .update(password)
          .digest("hex");
      } catch (err) {
        console.log(err.message);
        return "";
      }
    },
    authenticate: function (plainText) {
      return this.encryptPassword(plainText) === this.hashed_password;
    },
  };

parentSchema.plugin(mongoosePaginate);
parentSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("parent", parentSchema);
