const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Like = new Schema({
  user_id: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  book_id: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  createDate: { type: Date, default: Date.now(), required: true },
});
module.exports = mongoose.model("Like", Like);
