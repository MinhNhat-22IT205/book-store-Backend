const HttpError = require("../model/httpError");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const checkAuth = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return next(new HttpError("No token found, request failed", 401));
  }
  const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  req.userData = { userId: decodedToken.userId };
  return next();
};
module.exports = checkAuth;
