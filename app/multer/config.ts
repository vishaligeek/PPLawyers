import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./app/postMedia"); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});


const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|mp4/; 
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("File type not supported. Only images and videos are allowed."));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 120 * 1024 * 1024 }, 
  fileFilter: fileFilter,
});
