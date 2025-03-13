import { Router } from "express";
const router = Router();
import {
  createPost,
  deletePost,
  editPost,
  getAllPosts,
  getPost,
} from "../controllers/post";
import { adminVerify } from "../middleware/adminCheck";
import { upload } from "../multer/config";

router.post("/createpost", adminVerify, upload, createPost);
router.put("/editpost/:postId", adminVerify, upload, editPost);
router.delete("/deletepost/:postId", deletePost);
router.get("/posts", getAllPosts);
router.get("/:postId", getPost);

module.exports = router;
