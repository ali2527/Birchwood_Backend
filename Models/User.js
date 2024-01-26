const mongoose = require("mongoose");
const { createHmac } = require('node:crypto');
const mongoosePaginate = require('mongoose-paginate');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const { token } = require("morgan");
const { v4: uuidv4 } = require('uuid');
const {generateRandom6DigitID} = require("../Helpers")

const userSchema = new Schema(
  {
    studentId: {
      type: String,
      unique: true,
      default: generateRandom6DigitID('S'),
    },
    firstName: {
      type: String,
      minlength: 3,
      required: true,
    },
    lastName: {
      type: String,
      required: false,
    },
    age: {
      type: String,
      required: false,
    },
    birthday: {
      type: Date,
      required:false,
    },
    email: {
      type: String,
      minlength: 3,
      required: true,
      unique: true,
      dropDups: true,
    },
    parent:{
      type:String,
      required: false,
    },
    phoneNumber:{
      type: String,
      
    },
    homeNumber:{
      type: String,
    },
    school: {
      type: String,
      default : ""
    },
    gradeLevel:{
      type: String,
    },
    salt: String,
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
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    zip: {
      type: String,
      minlength: 3,
    },
    image: {
      type: String,
    },
    hashed_password: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    subjects: [
       {
          type: String,
        },
    ],
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
      },
    ],
    coaches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "coach",
      },
    ],
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = uuidv4();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

  userSchema.methods = {
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

userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("user", userSchema);
