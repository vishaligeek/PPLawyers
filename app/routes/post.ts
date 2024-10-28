import { Router } from "express";
import { createPost, deletePost, editPost, getAllPosts } from "../controllers/post"; 
import { adminVerify }  from "../middleware/adminCheck";
import { upload } from "../multer/config";

const router = Router();

router.post('/createpost',adminVerify, upload.single("url"),createPost)
router.put('/editpost/:postId',adminVerify,upload.single("url"),editPost)
router.delete('/deletepost/:postId',deletePost)
router.get("/posts",getAllPosts);

module.exports = router;
