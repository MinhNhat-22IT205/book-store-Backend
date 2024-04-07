const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Book = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: true },
  image: { type: String, required: true },
  genre: { type: [String], required: true },
  ISBN: { type: String, required: true },
  language: { type: String, required: true },
  bookFormat: { type: String, required: true },
  tag: { type: [String], required: true },
  createDate: { type: Date, default: Date.now(), required: true },
  numberInStock: { type: Number, default: 1, required: true },
  price: { type: Number, default: 0, required: true },
  discount: { type: Number, default: 0, required: true },
  shipPrice: { type: Number, default: 0, required: true },
  numberBought: { type: Number, default: 0 },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});
module.exports = mongoose.model("Book", Book);
