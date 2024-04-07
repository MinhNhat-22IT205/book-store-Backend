const express = require("express");
const router = express.Router();
const upload = require("../middlewares/file-upload");
const {
  signup,
  login,
  getUserById,
  updateUserInfor,
  uploadCover,
  getUsers,
  deleteUser,
} = require("../controller/users-controller");
const checkAuth = require("../middlewares/checkAuth");

router.get("/", getUsers);

router.get("/:uid", getUserById);

router.post("/signup", upload.single("avatar"), signup);

router.post("/login", login);

router.use(checkAuth);

router.patch("/:uid/cover", upload.single("coverImage"), uploadCover);

router.patch("/:uid", upload.single("avatar"), updateUserInfor);

router.delete("/:uid", deleteUser);

module.exports = router;
