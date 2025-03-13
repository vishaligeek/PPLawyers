import multer from "multer";
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  keyFilename: "./bucket.json",
});
const bucketName = process.env.GCP_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

const multerStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "video/mp4"];
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(
      new Error("File type not supported. Only images and videos are allowed.")
    );
  }
};

export const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).single("imageName");
