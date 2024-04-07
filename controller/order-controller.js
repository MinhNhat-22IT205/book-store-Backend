const { default: mongoose } = require("mongoose");

const HttpError = require("../model/httpError");
const Order = require("../model/order");
const OrderItem = require("../model/order-item");
const ObjectId = require("mongoose").Types.ObjectId;

const getOrders = async (req, res, next) => {
  const uid = req.params.uid;
  let orders;
  try {
    orders = await Order.find({ user_id: uid }).populate({
      path: "items",
      populate: { path: "book", model: "Book" },
    });
  } catch (er) {
    return next(new HttpError("Fetching failed!", 500));
  }
  if (!orders || orders.length === 0) {
    return next(new HttpError("No orders found", 404));
  }
  res.json({
    orders: orders.map((order) => order.toObject({ getters: true })),
  });
};

const getOrderedItemOfUser = async (req, res, next) => {
  const uid = req.params.uid;
  let ordereditems;
  try {
    ordereditems = await OrderItem.find()
      .populate("book")
      .populate({
        path: "order_id",
        populate: { path: "user_id", model: "User" },
      });
  } catch (er) {
    return next(new HttpError("Fetching failed!", 500));
  }
  ordereditems = ordereditems.map((item) => item.toObject({ getters: true }));
  let resData = [];
  for (let i = 0; i < ordereditems.length; i++) {
    if (ordereditems[i].book.creator == uid) {
      resData.push(ordereditems[i]);
    }
  }
  if (!ordereditems || ordereditems.length === 0) {
    return next(new HttpError("No orders found!", 404));
  }
  res.json({
    orders: resData,
  });
};

const exportItem = async (req, res, next) => {
  const iid = req.params.iid;
  const { uid } = req.body;
  //token
  if (req.userData.userId != uid) {
    return next(new HttpError("User mismatch!", 401));
  }
  let orderedItem;
  try {
    orderedItem = await OrderItem.findById(iid).populate("book").exec();
  } catch (er) {
    return next(new HttpError("Fetching failed!", 500));
  }
  if (!orderedItem) {
    return next(new HttpError("Could not find item for the provided id", 404));
  }
  if (req.userData.userId != orderedItem.book.creator) {
    return next(new HttpError("User mismatch", 401));
  }
  //change status
  //check to change whole order's status
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    orderedItem.status = "Completed";
    await orderedItem.save({ session });

    const order = await Order.findById(orderedItem.order_id).populate("items");
    const isCompleted = order.items.every((item) => {
      if (orderedItem._id.toString() !== item._id.toString())
        return item.status === "Completed";
      else return true;
    });
    if (isCompleted) {
      order.orderStatus = "Shipping..";
      await order.save({ session });
    }
    await session.commitTransaction();
  } catch (er) {
    await session.abortTransaction();
    return next(new HttpError("Export item failed" + er, 500));
  }
  res.json({ orderedItem: orderedItem.toObject({ getters: true }) });

  //numberinsctock-- ->checkout?//
  //numberBought++
  //totalbooksold
  //totalEarned
};

const bookStatisticByDate = async (req, res, next) => {
  const bid = req.params.bid;
  let statistic;
  try {
    statistic = await OrderItem.aggregate([
      {
        $match: {
          book: new mongoose.Types.ObjectId(bid),
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "order_id",
          foreignField: "_id",
          as: "order",
        },
      },
      {
        $unwind: "$order",
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$order.checkOutDate",
            },
          },
          bookBought: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          date: "$_id",
          bookBought: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          date: 1, // Sort in ascending order by date
        },
      },
    ]);
  } catch (err) {
    return next(new HttpError("Fetching failed " + err, 500));
  }
  res.json({ data: statistic });
};

const getSales = async (req, res, next) => {
  const startDate = new Date(new Date() - 7 * 24 * 60 * 60 * 1000); // Start date 7 days ago
  const endDate = new Date(); // Current date and time
  const dates = [];

  let currentDate = startDate;
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  let sales;
  try {
    sales = await Order.aggregate([
      {
        $match: {
          checkOutDate: {
            $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000), // Filter documents from the last 7 days
            $lt: new Date(), // Filter documents up to the current date and time
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkOutDate" } },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
  } catch (er) {
    return next(new HttpError("Fetching failed " + er, 500));
  }
  const result = dates.map((date) => {
    const dateString = date.toISOString().split("T")[0];
    const sale = sales.find((s) => s._id === dateString);
    return {
      date: dateString,
      totalSales: sale ? sale.totalSales : 0,
    };
  });
  res.json({
    sales: result,
  });
};

exports.getOrders = getOrders;
exports.getOrderedItemOfUser = getOrderedItemOfUser;
exports.exportItem = exportItem;
exports.bookStatisticByDate = bookStatisticByDate;
exports.getSales = getSales;
