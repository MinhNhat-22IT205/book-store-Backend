const express = require("express");
const router = express.Router();
const upload = require("../middlewares/file-upload");
const checkAuth = require("../middlewares/checkAuth");
const {
  getBooks,
  createBook,
  updateBook,
  getBookById,
  getBooksByCreator,
  deleteBook,
} = require("../controller/books-controller");

router.get("/", getBooks);

router.get("/:bid", getBookById);

router.get("/mybooks/:uid/", getBooksByCreator);

router.use(checkAuth);

router.post("/", upload.single("image"), createBook);

router.patch("/:bid", upload.single("image"), updateBook);

router.delete("/:bid", deleteBook);

module.exports = router;
