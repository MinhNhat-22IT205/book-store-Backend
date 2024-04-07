const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
require("dotenv").config();

const HttpError = require("../model/httpError");
const User = require("../model/user.js");

const login = async (req, res, next) => {
  //isAdmin?
  const data = req.body;
  let user;
  try {
    user = await User.findOne({ email: data.email }).populate({
      path: "cart",
      populate: {
        path: "items.book",
        model: "Book",
      },
    });
  } catch (er) {
    return next(new HttpError("Fetching user failed!", 500));
  }
  if (!user) {
    return next(new HttpError("Invalid credentials please try again", 401));
  }
  let isValidPassword;
  try {
    isValidPassword = await bcrypt.compare(data.password, user.password);
  } catch (er) {
    return next(new HttpError("Fetching failed!" + er, 500));
  }
  if (!isValidPassword) {
    return next(new HttpError("Invalid credentials please try again", 401));
  }
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );

  const { password, ...resData } = user.toObject({ getters: true });
  res.json({ message: "Logged in!", user: resData, accessToken: token });
};

const signup = async (req, res, next) => {
  const data = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: data.email });
  } catch (er) {
    return next(new HttpError("Fetching user fail!", 500));
  }
  if (existingUser) {
    return next(new HttpError("Email already existed!", 422));
  }
  let encryptedPassword;
  try {
    encryptedPassword = await bcrypt.hash(data.password, 12);
  } catch (er) {
    return next(new HttpError("Signning up failed!", 500));
  }
  const createdUser = new User({
    username: data.username,
    email: data.email,
    password: encryptedPassword,
    avatar: req.file ? req.file.path : "uploads/images/fake-user.png",
    coverImage: "",
    bio: "",
    address: "",
    contactNumber: "",
    isAdmin: data.isAdmin ? data.isAdmin : false,
  });
  try {
    await createdUser.save();
  } catch (er) {
    return next(new HttpError("Signing up failed!", 500));
  }
  const { password, ...resData } = createdUser.toObject({ getters: true });
  res.json({ user: resData });
};

const getUserById = async (req, res, next) => {
  const uid = req.params.uid;
  let user;
  try {
    user = await User.findById(uid).populate({
      path: "cart",
      populate: {
        path: "items.book",
        model: "Book",
      },
    });
  } catch (er) {
    return next(new HttpError("Fetching failed!", 500));
  }
  if (!user) {
    return next(new HttpError("Could not find user for the provide id", 404));
  }
  const { password, ...resData } = user.toObject({ getters: true });
  res.json({ user: resData });
};

const updateUserInfor = async (req, res, next) => {
  const data = req.body;
  const uid = req.params.uid;
  let user;
  try {
    user = await User.findById(uid);
  } catch (er) {
    return next(new HttpError("Fetching user failed! " + er, 500));
  }
  if (!user) {
    return next(
      new HttpError("Can not find any user for the provided id", 404)
    );
  }
  let admin;
  try {
    admin = await User.findById(req.userData.userId);
  } catch (er) {
    return next(new HttpError("Fetching user failed! " + er, 500));
  }
  if (!user) {
    return next(
      new HttpError("Can not find any user for the provided id", 404)
    );
  }
  if (user.id != req.userData.userId && !admin.isAdmin) {
    return next(new HttpError("Update user fail!", 401));
  }
  if (data.email) {
    let userWithSameEmail;
    try {
      userWithSameEmail = await User.findOne({
        email: data.email,
        _id: { $ne: uid },
      });
    } catch (er) {
      return next(new HttpError("Fetching user failed!", 500));
    }
    if (userWithSameEmail) {
      return next(new HttpError("Email already been taken", 401));
    }
  }

  user.username = data.username || user.username;
  user.bio = data.bio || user.bio;
  user.email = data.email || user.email;
  user.address = data.address || user.address;
  user.contactNumber = data.contactNumber || user.contactNumber;

  if (req.file) {
    fs.unlink(user.avatar, (er) => console.log(er));
    user.avatar = req.file.path;
  }
  try {
    await user.save();
  } catch (er) {
    return next(new HttpError("Update user fail!" + er, 401));
  }
  res.json({ user: user.toObject({ getters: true }) });
};

const uploadCover = async (req, res, next) => {
  const data = req.body;
  const uid = req.params.uid;
  let user;
  try {
    user = await User.findById(uid);
  } catch (er) {
    return next(new HttpError("Fetching user failed! " + er, 500));
  }
  if (!user) {
    return next(
      new HttpError("Can not find any user for the provided id", 404)
    );
  }
  if (user.id != req.userData.userId) {
    return next(new HttpError("Upload fail!", 401));
  }
  if (!req.file) {
    return next(new HttpError("Upload fail!", 401));
  }
  if (user.coverImage) {
    fs.unlink(user.coverImage, (er) => console.log(er));
  }
  user.coverImage = req.file.path;
  try {
    await user.save();
  } catch (er) {
    return next(new HttpError("Upload fail!" + er, 401));
  }
  res.json({ user: user.toObject({ getters: true }) });
};

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find();
  } catch (er) {
    return next(new HttpError("Fetching fail!" + er, 505));
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const deleteUser = async (req, res, next) => {
  const id = req.params.uid;
  let user;
  try {
    user = await User.findById(id);
  } catch (err) {
    const error = new HttpError("Fetching failed!", 500);
    return next(error);
  }
  console.log(1);
  if (!user) {
    return next(new HttpError("Could not find the user", 404));
  }
  console.log(2);

  try {
    await user.deleteOne();
  } catch (err) {
    const error = new HttpError("Deleting failed due to " + err, 500);
    return next(error);
  }

  res.status(200).json({ message: "User deleted!" });
};

exports.signup = signup;
exports.login = login;
exports.getUserById = getUserById;
exports.updateUserInfor = updateUserInfor;
exports.uploadCover = uploadCover;
exports.getUsers = getUsers;
exports.deleteUser = deleteUser;
