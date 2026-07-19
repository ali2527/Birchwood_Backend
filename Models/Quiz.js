const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;




const questionSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    options: [{
      text:String,
      value:String
    }],
    score: {
      type: Number,
      required: true,
    },
    correctOption: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const quizSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
    },
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lecture",
    },
    quizDate: {
      type: Date,
      required: true,
    },
    passingPercentage: {
      type: Number,
      required: true,
    },
    totalScore:{
      type: Number,
      default: 0,
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

// Add a virtual property to calculate the total score
quizSchema.pre("save", function (next) {
  this.totalScore = this.questions.reduce((total, question) => total + question.score, 0);
  next();
});

quizSchema.plugin(mongoosePaginate);
quizSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("quiz", quizSchema);
