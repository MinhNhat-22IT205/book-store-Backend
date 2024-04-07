const express = require("express");
const router = express.Router();
const upload = require("../middlewares/file-upload");
const checkAuth = require("../middlewares/checkAuth");
const {
  getDataCounts,
  getLeaderboard,
} = require("../controller/statistics-controller");

router.get("/counts", getDataCounts);

router.get("/topsales", getLeaderboard);

module.exports = router;
