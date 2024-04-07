const express = require("express");
const router = express.Router();

const checkAuth = require("../middlewares/checkAuth");
const {
  getOrderedItemOfUser,
  getOrders,
  exportItem,
  bookStatisticByDate,
  getSales,
} = require("../controller/order-controller");

router.get("/ordereditems/:uid", getOrderedItemOfUser);

router.get("/statistic/:bid", bookStatisticByDate);

router.get("/sales", getSales);

router.get("/:uid", getOrders);

router.use(checkAuth);

router.post("/export/:iid", exportItem);

module.exports = router;
