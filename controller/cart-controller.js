const HttpError = require("../model/httpError");
const User = require("../model/user");
const Cart = require("../model/cart");
const Order = require("../model/order");
const OrderItem = require("../model/order-item");
const { default: mongoose } = require("mongoose");

const getCartForUserId = async (req, res, next) => {
  const data = req.body;
  const uid = req.params.uid;
  let user;
  try {
    user = await User.findById(uid);
  } catch (er) {
    return next(new HttpError("Fetching failed!", 500));
  }
  if (!user) {
    return next(new HttpError("Could not find user for the provided id", 404));
  }
  let cart;
  try {
    cart = await Cart.findOne({ user_id: uid });
  } catch (er) {
    return next(new HttpError("Fetch cart failed!", 500));
  }
  if (!cart) {
    return next(new HttpError("This user cart is empty", 404));
  }
  res.json({ cart: cart.toObject({ getters: true }) });
};

const updateCart = async (req, res, next) => {
  const data = req.body;
  const uid = req.params.uid;
  if (req.userData.userId != uid) {
    return next(new HttpError("User mismatch!", 401));
  }
  let user;
  try {
    user = await User.findById(uid);
  } catch (er) {
    return next(new HttpError("Fetching failed!", 500));
  }
  if (!user) {
    return next(new HttpError("Could not find user for the provided id", 404));
  }
  let cart;
  try {
    cart = await Cart.findOne({ user_id: uid });
  } catch (er) {
    return next(new HttpError("Fetching cart failed!", 500));
  }
  let createdCart;
  if (!cart) {
    createdCart = new Cart({
      user_id: uid,
      items: data.items,
      totalAmount: data.totalAmount,
    });
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdCart.save({ session: sess });
      user.cart = createdCart;
      await user.save({ session: sess });
      await sess.commitTransaction();
    } catch (er) {
      return next(new HttpError("Update cart failed", 500));
    }
  } else {
    try {
      Object.assign(cart, data);
      await cart.save();
    } catch (er) {
      return next(new HttpError("Update cart failed" + er, 500));
    }
  }
  if (cart) {
    res.json({ cart: cart.toObject({ getters: true }) });
  } else {
    res.json({ cart: createdCart.toObject({ getters: true }) });
  }
};

const checkout = async (req, res, next) => {
  const data = req.body;
  const uid = req.params.uid;
  if (req.userData.userId != uid) {
    return next(new HttpError("User mismatch!", 401));
  }
  let cart;
  try {
    cart = await Cart.findOne({ user_id: uid }).populate("user_id");
  } catch (er) {
    return next(new HttpError("Fetching failed!", 500));
  }
  if (!cart || cart.items.length === 0) {
    return next(new HttpError("Cart empty!", 404));
  }
  let sess;

  const createdOrder = new Order({
    user_id: uid,
    items: [],
    totalAmount: cart.totalAmount,
    deliveryAddress: data.deliveryAddress,
    receiverName: data.receiverName,
    phoneNumber: data.phoneNumber,
  });

  try {
    sess = await mongoose.startSession();
    sess.startTransaction();
    const items = cart.toObject().items.map((item) => {
      const { _id, ...itemData } = item;
      return { ...itemData, status: "Pending..", order_id: createdOrder._id };
    });
    for (const item of items) {
      const createdOrderItem = new OrderItem(item);
      createdOrder.items.push(createdOrderItem);
      await createdOrderItem.save({ session: sess });

      await createdOrderItem.populate({
        path: "book",
        populate: { path: "creator", model: "User" },
      });
      if (
        createdOrderItem.book.numberInStock - createdOrderItem.quantity <=
        -1
      ) {
        throw new Error(`"${createdOrderItem.book.title}" is out of stock`);
      }
      createdOrderItem.book.numberInStock -= createdOrderItem.quantity;
      createdOrderItem.book.numberBought += createdOrderItem.quantity;
      await createdOrderItem.book.save({ session: sess });
      createdOrderItem.book.creator.totalBookSold += createdOrderItem.quantity;
      createdOrderItem.book.creator.totalEarned +=
        createdOrderItem.quantity *
        (createdOrderItem.book.price -
          (createdOrderItem.book.price * createdOrderItem.book.discount) / 100);
      await createdOrderItem.book.creator.save({ session: sess });
    }
    await createdOrder.save({ session: sess });
    await cart.deleteOne({ session: sess });
    cart.user_id.cart = null;
    await cart.user_id.save({ session: sess });

    await sess.commitTransaction();
    sess.endSession();
  } catch (er) {
    await sess.abortTransaction();
    sess.endSession();
    return next(new HttpError("Checkout failed! " + er.message, 500));
  }
  res.json({ order: createdOrder.toObject({ getters: true }) });
};

exports.getCartForUserId = getCartForUserId;
exports.updateCart = updateCart;
exports.checkout = checkout;
