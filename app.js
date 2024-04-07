const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const bookRouter = require("./routes/books-routes");
const userRouter = require("./routes/users-routes");
const cartRouter = require("./routes/cart-routes");
const orderRouter = require("./routes/orders-routes");
const reviewRouter = require("./routes/reviews-routes");
const statisticRouter = require("./routes/statistics-routes");

const app = express();

app.use(bodyParser.json()); //bodyparser doesnt support formdata, need multer

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use("/", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Origin, X-Requested-With, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "PATCH, POST, GET, DELETE");
  next();
});

app.use("/books", bookRouter);

app.use("/users", userRouter);

app.use("/cart", cartRouter);

app.use("/orders", orderRouter);

app.use("/reviews", reviewRouter);

app.use("/statistics", statisticRouter);

app.use((req, res, next) => {
  const error = new HttpError("Page not found!", 404);
  throw error;
});
app.use((er, req, res, next) => {
  if (req.file) {
    //req has file? -> rollback
    fs.unlink(req.file.path, (er) => {
      console.log(er);
    });
  }

  if (er.headerSent) {
    return next(er);
  }
  res.status(er.code || 500);
  res.json({ message: er.message || "Unknown error occured!" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.wxmjvql.mongodb.net/bookstore?retryWrites=true&w=majority&appName=AtlasApp`
    // "mongodb://nyatto:n20072003n@ac-qc9xfap-shard-00-00.wxmjvql.mongodb.net:27017,ac-qc9xfap-shard-00-01.wxmjvql.mongodb.net:27017,ac-qc9xfap-shard-00-02.wxmjvql.mongodb.net:27017/?ssl=true&replicaSet=atlas-tpeedm-shard-0&authSource=admin&retryWrites=true&w=majority&appName=AtlasApp"
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((er) => {
    console.log(er);
  });
