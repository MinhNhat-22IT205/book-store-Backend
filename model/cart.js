const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Cart = new Schema({
  user_id: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  items: [
    {
      book: { type: mongoose.Types.ObjectId, ref: "Book", required: true },
      quantity: { type: Number, default: 1, required: true },
    },
  ],
  totalAmount: { type: Number, default: 0, required: true },
});
module.exports = mongoose.model("Cart", Cart);
