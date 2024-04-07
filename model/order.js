const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Order = new Schema({
  user_id: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  items: [{ type: mongoose.Types.ObjectId, required: true, ref: "OrderItem" }],
  totalAmount: { type: Number, default: 0, required: true },
  orderStatus: {
    type: String,
    enum: ["Obtaining order..", "Shipping..", "Finished"],
    default: "Obtaining order..",
  },
  checkOutDate: { type: Date, default: Date.now(), required: true },
  deliveryAddress: { type: String, required: true },
  receiverName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
});

module.exports = mongoose.model("Order", Order);
