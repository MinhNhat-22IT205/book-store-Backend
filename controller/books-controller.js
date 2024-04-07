const Book = require("../model/book");
const User = require("../model/user");
const HttpError = require("../model/httpError");

const { default: mongoose } = require("mongoose");
const fs = require("fs");

const getBooks = async (req, res, next) => {
  const page = req.query.p || 1;
  let { date, order, search, category, createYear, price } = req.query;
  category = category?.split(",");
  createYear = createYear?.split(",");
  price = price?.split(",");
  const bookPerPage = 8;

  const query = Book.find();

  if (date) {
    const startOfRange = new Date();

    if (date === "month") {
      startOfRange.setDate(1); // First day of the current month
    } else if (date === "week") {
      startOfRange.setDate(startOfRange.getDate() - startOfRange.getDay()); // First day of the current week
    } else if (date === "today") {
      startOfRange.setHours(0, 0, 0, 0); // Start of the current day
    }

    query.where("createDate").gte(startOfRange);
  }

  if (search) {
    query.or([
      { author: { $regex: search, $options: "i" } }, // Case-insensitive search for author
      { title: { $regex: search, $options: "i" } }, // Case-insensitive search for title
    ]);
  }
  if (category && category[0] !== "") {
    query.find({
      genre: { $in: category },
    });
  }
  // if (createYear) {
  //   query.find({
  //     createDate: {
  //       $expr: {
  //         $in: [{ $year: "$createDate" }, createYear],
  //       },
  //     },
  //   });
  // }
  if (price && price[1]) {
    console.log(price);
    query.find({
      price: { $gte: price[0], $lte: price[1] },
    });
  }

  if (order) {
    query.sort({ createDate: order });
  }
  let books;
  try {
    books = await query
      .clone()
      .skip((page - 1) * bookPerPage)
      .limit(bookPerPage)
      .exec();
  } catch (er) {
    return next(new HttpError("Fetching failed!" + er, 500));
  }
  if (!books || books.length === 0) {
    return next(new HttpError("No books found!", 404));
  }
  let numberOfBook;
  try {
    numberOfBook = await query.countDocuments();
  } catch (er) {
    return next(new HttpError("Fetching failed" + er, 500));
  }
  res.json({
    books: books.map((book) => book.toObject({ getters: true })),
    totalNumber: numberOfBook,
  });
};

const getBooksByCreator = async (req, res, next) => {
  const uid = req.params.uid;
  let books;
  try {
    books = await Book.find({ creator: uid });
  } catch (er) {
    return next(new HttpError("Fetching failed!", 500));
  }
  if (!books || books.length === 0) {
    return next(new HttpError("No books found", 404));
  }
  res.json({ books: books.map((item) => item.toObject({ getters: true })) });
};

const getBookById = async (req, res, next) => {
  const bid = req.params.bid;
  let book;
  try {
    book = await Book.findById(bid).populate("creator");
  } catch (er) {
    return next(new HttpError("Fetching failed!", 500));
  }
  if (!book) {
    return next(new HttpError("Could not find book for the provide id", 404));
  }
  res.json({ book: book.toObject({ getters: true }) });
};

const createBook = async (req, res, next) => {
  const data = req.body;
  const createdBook = new Book({
    title: data.title,
    description: data.description,
    author: data.author,
    image: req.file ? req.file.path : "fake image",
    genre: data.genre,
    ISBN: data.ISBN,
    language: data.language,
    bookFormat: data.bookFormat,
    tag: data.tag,
    numberInStock: data.numberInStock,
    price: data.price,
    discount: data.discount,
    shipPrice: data.shipPrice,
    creator: data.creator,
  });
  let user;
  try {
    user = await User.findById(data.creator);
  } catch (er) {
    return next(new HttpError("Fetching user failed!", 500));
  }
  if (!user) {
    return next(new HttpError("Could not find user for the provide Id", 404));
  }
  if (user.id != req.userData.userId) {
    return next(new HttpError("Create book failed!", 401));
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdBook.save({ session: sess });
    user.books.push(createdBook);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (er) {
    return next(new HttpError("Created book failed due to " + er, 500));
  }
  res.status(201).json({ book: createdBook.toObject({ getters: true }) });
};

const updateBook = async (req, res, next) => {
  const data = req.body;
  const bid = req.params.bid;
  let book;
  try {
    book = await Book.findById(bid);
  } catch (er) {
    return next(new HttpError("Fetching user failed!", 500));
  }
  if (!book) {
    return next(
      new HttpError("Can not find any book for the provided id", 404)
    );
  }
  if (book.creator != req.userData.userId) {
    return next(new HttpError("Update book fail!", 401));
  }

  book.title = data.title;
  book.description = data.description;
  book.author = data.author;
  book.genre = data.genre;
  book.ISBN = data.ISBN;
  book.language = data.language;
  book.bookFormat = data.bookFormat;
  book.tag = data.tag;
  book.numberInStock = data.numberInStock;
  book.price = data.price;
  book.discount = data.discount;
  book.shipPrice = data.shipPrice;

  if (req.file) {
    fs.unlink(book.image, (er) => console.log(er));
    book.image = req.file.path;
  }
  try {
    await book.save();
  } catch (er) {
    return next(new HttpError("Update book fail!" + er, 401));
  }
  res.json({ book: book.toObject({ getters: true }) });
};

const deleteBook = async (req, res, next) => {
  const id = req.params.bid;
  let book;
  try {
    book = await Book.findById(id).populate("creator");
  } catch (err) {
    const error = new HttpError("Fetching failed!", 500);
    return next(error);
  }
  if (!book) {
    return next(new HttpError("Could not find the book", 404));
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await book.deleteOne({ session: session });
    book.creator.books.pull(book);
    await book.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    const error = new HttpError("Deleting failed due to " + err, 500);
    return next(error);
  } finally {
    session.endSession();
  }

  fs.unlink(book.image, (err) => {
    if (err) {
      console.log(err);
    }
  });

  res.status(200).json({ message: "Book deleted!" });
};

exports.getBooks = getBooks;
exports.getBooksByCreator = getBooksByCreator;
exports.createBook = createBook;
exports.updateBook = updateBook;
exports.deleteBook = deleteBook;
exports.getBookById = getBookById;
