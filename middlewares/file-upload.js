const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const MIME_TYPES_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images");
  },
  filename: (req, file, cb) => {
    const ext = MIME_TYPES_MAP[file.mimetype];
    cb(null, `${uuidv4()}.${ext}`);
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPES_MAP[file.mimetype]; //if exist the required mime type
    const error = isValid ? null : new Error("Invalid mime type");
    cb(error, isValid); //check isValid, accept file if true (null,true), throw error if false (new Error, false)
  },
});

module.exports = upload;
