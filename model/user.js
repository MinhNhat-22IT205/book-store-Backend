const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, required: false },
  coverImage: { type: String, required: false },
  bio: { type: String },
  address: { type: String },
  contactNumber: { type: String },
  registerDate: { type: Date, default: Date.now(), required: true },
  isAdmin: { type: Boolean, default: false, required: true },
  books: [{ type: mongoose.Types.ObjectId, required: true, ref: "Book" }],
  cart: { type: mongoose.Types.ObjectId, ref: "Cart" },
  totalBookSold: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
});
module.exports = mongoose.model("User", User);
