const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");


const educationSchema = new mongoose.Schema({
  school: {
    type: String,
    default:"" 
  },
  start:{
    type: Date,
    required:false,
  },
  end: {
    type:Date,
    required:false,
  },
  subject:[{
    type:String,
    required:false,
  }],
});


const employmentSchema = new mongoose.Schema({
  school: {
    type: String,
    required:false,
    default:"" 
  },
  address:{
    type:String,
    required:false,
    default:"" 
  },
  position:{
    type:String,
    required:false,
    default:"" 
  },
  start:{
    type: Date,
    required:false,
  },
  end: {
    type:Date,
    required:false,
  },
});


const teacherSchema = new Schema(
  {
    teacherId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      minlength: 3,
      required: false,
    },
    lastName: {
      type: String,
      minlength: 3,
      required: true,
    },
    email: {
      type: String,
      minlength: 3,
      required: false,
      unique: true,
      dropDups: true,
    },
    phone:{
      type: String,
      minlength: 9,
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
    zip: {
      type: String,
      minlength: 3,
    },
    homeNumber:{
      type: String,
    },
    image: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    placeOfBirth: {
      type: String,
      required: false,
    },

    hashed_password: {
      type: String,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "classroom",
    },
    education:[educationSchema],
    bio: {
      type: String,
      required: false,
      default:""
    },
    checkIn: {
      type: Boolean,
      default: false,
    },
    checkOut: {
      type: Boolean,
      default: true,
    },
    bio: {
      type: String,
      required: false,
      default:""
    },
    employment:[employmentSchema],
    salt: String,
    status: {
      type: String,
      enum: ["PENDING","ACTIVE", "INACTIVE"],
      default: "PENDING",
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

teacherSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = uuidv4();
    this.hashed_password = bcrypt.hashSync(password, 10);
  })
  .get(function () {
    return this._password;
  });

teacherSchema.methods = {
  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return crypto.createHmac("sha1", this.salt).update(password).digest("hex");
    } catch (err) {
      console.log(err.message);
      return "";
    }
  },
  authenticate: function (plainText) {
    if (!this.hashed_password) return false;
    if (this.hashed_password.startsWith("$2")) {
      return bcrypt.compareSync(plainText, this.hashed_password);
    }
    return this.encryptPassword(plainText) === this.hashed_password;
  },
};

teacherSchema.plugin(mongoosePaginate);
teacherSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("teacher", teacherSchema);
