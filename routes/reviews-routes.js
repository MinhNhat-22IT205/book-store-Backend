const express = require("express");
const router = express.Router();

const checkAuth = require("../middlewares/checkAuth");
const {
  getReviewsByBook,
  createReview,
} = require("../controller/reviews-controller");

router.get("/:bid", getReviewsByBook);

router.use(checkAuth);

router.post("/:bid", createReview);

module.exports = router;
