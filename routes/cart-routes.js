const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuth");
const {
  getCartForUserId,
  updateCart,
  checkout,
} = require("../controller/cart-controller");

router.get("/:uid", getCartForUserId);

router.use(checkAuth);

router.patch("/:uid", updateCart);

router.post("/:uid/checkout", checkout);

module.exports = router;
