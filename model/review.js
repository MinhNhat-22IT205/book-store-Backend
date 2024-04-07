const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Review = new Schema({
  user_id: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  book_id: { type: mongoose.Types.ObjectId, required: true, ref: "Book" },
  star: { type: Number, required: true },
  comment: { type: String, required: true },
  createDate: { type: Date, default: Date.now(), required: true },
});
module.exports = mongoose.model("Review", Review);
