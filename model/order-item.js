const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderItem = new Schema({
  order_id: { type: mongoose.Types.ObjectId, required: true, ref: "Order" },
  book: { type: mongoose.Types.ObjectId, required: true, ref: "Book" },
  quantity: { type: Number, default: 1, required: true },
  status: {
    type: String,
    enum: ["Pending..", "Completed"],
    default: "Pending..",
  },
});
// OrderItem.pre("save", async function (next) {
//   await this.populate({
//     path: "order_id",
//     populate: { path: "items", model: "OrderItem" },
//   });
//   const isCompleted = this.order_id.items.every((item) => {
//     if (this._id.toString() !== item._id.toString())
//       return item.status === "Completed";
//     else return true;
//   });
//   if (isCompleted) {
//     this.order_id.orderStatus = "Shipping..";
//     await this.order_id.save();
//   }
//   next();
// });
module.exports = mongoose.model("OrderItem", OrderItem);
