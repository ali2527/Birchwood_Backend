const path = require("path");
const multer = require("multer");
const { ApiResponse } = require("../Helpers");

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    
    req.body.image = uniqueSuffix + path.extname(file.originalname);


 
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});


const multiStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

exports.uploadFile = function (req, res, next) {
  
  var upload = multer({
    storage: imageStorage,
    fileFilter: (req, file, cb) => {
     
      
      if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/gif" ||
        file.mimetype === "image/webop"
      ) {
        cb(null, true);
      } else if (!file) {
        cb(null, false);
        next();
      } else {
        cb(new Error("Image File Type not Allowed"), false);
      }
    },
  }).single("image");

  upload(req, res, function (err) {
    if (err) {
      return res.json(ApiResponse({}, err.message, false));
    }
    next();
  });
};

const uploadMultiple = multer({
  storage: multiStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/gif" ||
        file.mimetype === "video/mp4" ||
          file.mimetype === "video/mpeg" ||
          file.mimetype === "video/quicktime" ||
          file.mimetype === "video/x-msvideo" ||
          file.mimetype === "video/x-flv" ||
          file.mimetype === "video/x-matroska" ||
          file.mimetype === "video/webm"
    ) {
      cb(null, true);
    } else {
      // cb(new Error("File type not allowed"), false);
      cb(null, true);
    }
  },
});

exports.uploadMultiple = uploadMultiple.fields([{ name: "image", maxCount: 10 }, { name: "video", maxCount: 10 }]);

const uploadProduct = multer({
  storage: multiStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/gif" ||
        file.mimetype === "video/mp4" ||
          file.mimetype === "video/mpeg" ||
          file.mimetype === "video/quicktime" ||
          file.mimetype === "video/x-msvideo" ||
          file.mimetype === "video/x-flv" ||
          file.mimetype === "video/x-matroska" ||
          file.mimetype === "video/webm"
    ) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  },
});

exports.uploadProduct = uploadProduct.fields([{ name: "image", maxCount: 1 }, { name: "gallery", maxCount: 10 }]);