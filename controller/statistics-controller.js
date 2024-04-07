const Book = require("../model/book");
const User = require("../model/user");
const OrderItem = require("../model/order-item");
const HttpError = require("../model/httpError");

const { default: mongoose } = require("mongoose");
const fs = require("fs");

const getDataCounts = async (req, res, next) => {
  let productCount;
  let userCount;
  let orderItemCount;
  try {
    productCount = await Book.find().countDocuments();
    userCount = await User.find().countDocuments();
    orderItemCount = await OrderItem.find().countDocuments();
  } catch (er) {
    return next(new HttpError("Fetching failed " + er, 500));
  }

  res.json({
    productCount,
    userCount,
    orderItemCount,
  });
};

const getLeaderboard = async (req, res, next) => {
  let topBooks;
  let topUsers;
  try {
    topBooks = await Book.aggregate([
      {
        $sort: {
          numberBought: -1, // Sort in descending order based on numberBought
        },
      },
      {
        $limit: 10, // Retrieve the top 10 books with the highest sale value
      },
    ]);
    topUsers = await User.aggregate([
      {
        $sort: {
          totalEarned: -1, // Sort in descending order based on numberBought
        },
      },
      {
        $limit: 10, // Retrieve the top 10 books with the highest sale value
      },
    ]);
  } catch (er) {
    return next(new HttpError("Fetching failed " + er, 500));
  }
  res.json({
    topBooks,
    topUsers,
  });
};

exports.getDataCounts = getDataCounts;
exports.getLeaderboard = getLeaderboard;
