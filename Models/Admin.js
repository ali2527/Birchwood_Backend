const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const adminSchema = new Schema(
  {
    firstName: {
      type: String,
      minlength: 3,
      required: true,
    },
    lastName: {
      type: String,
      required: false,
    },
 
    email: {
      type: String,
      minlength: 3,
      required: true,
      unique: true,
      dropDups: true,
      lowercase: true,
      trim: true,
    },
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
    salt: String,
    isAdmin: {
      type: Boolean,
      default: true,
    },
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

adminSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = uuidv4();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

  adminSchema.methods = {
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

adminSchema.plugin(mongoosePaginate);
adminSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("admin", adminSchema);
