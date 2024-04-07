const Review = require("../model/review");
const HttpError = require("../model/httpError");

const getReviewsByBook = async (req, res, next) => {
  const bid = req.params.bid;

  let reviews;
  try {
    reviews = await Review.find({ book_id: bid })
      .sort({ createDate: -1, _id: -1 })
      .populate("user_id");
  } catch (er) {
    return next(new HttpError("Fetching failed!" + er, 500));
  }
  if (!reviews || reviews.length === 0) {
    return next(new HttpError("No reviews found!", 404));
  }

  res.json({
    reviews: reviews.map((review) => review.toObject({ getters: true })),
  });
};

const createReview = async (req, res, next) => {
  const data = req.body;
  const bid = req.params.bid;
  //token
  if (data.user_id != req.userData.userId) {
    return next(new HttpError("Create review failed!", 401));
  }

  const createdReview = new Review({
    user_id: data.user_id,
    book_id: bid,
    star: data.star,
    comment: data.comment,
  });
  try {
    await createdReview.save();
  } catch (er) {
    return next(new HttpError("Created review failed due to " + er, 500));
  }
  res.status(201).json({ review: createdReview.toObject({ getters: true }) });
};

exports.getReviewsByBook = getReviewsByBook;
exports.createReview = createReview;
