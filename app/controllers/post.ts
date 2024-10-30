import { Request, Response } from "express";
import Post from "../db/models/post";
import Media from "../db/models/media";
import mongoose from "mongoose";
import { PostStatus } from "../types/postTypes";


export const createPost = async (req, res: Response): Promise<void> => {
  try {
    const { name, dateandtime, title, tag, description } =
      req.body;
    let media;

    if (!name) {
      res.status(400).json({ message: "Please enter your name" });
      return;
    } else if (!dateandtime) {
      res.status(400).json({ message: "Please select date & time" });
      return;
    } else if (!title) {
      res.status(400).json({ message: "Please enter a title" });
      return;
    } else if (!tag) {
      res.status(400).json({ message: "Please add a tag" });
      return;
    }
    const postDate = new Date(dateandtime).getTime();
    if (postDate < Date.now()) {
    res.status(400).json({ message: "Date is not valid" });
    return;
    }

    const newPost = await Post.create({
      name,
      dateandtime,
      title,
      tag,
      description,
      user: req.user._id,
      createdAt: new Date(),
    });

    if (req.file) {
      const { filename, mimetype } = req.file;
      media = await Media.create({
        post: newPost._id,
        url : filename,
        type: mimetype.split('/')[1]
      });
    }

    res
      .status(201)
      .json({
        message: "Post created successfully.",
        post: newPost,
        media: media,
      });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const editPost = async (req, res: Response): Promise<void> => {
  try {
    
    const { name, dateandtime, title, tag:strigifyTags } = req.body;
    const { postId } = req.params;
    const tag = JSON.parse(strigifyTags)

    const post = await Post.findById(postId);
    if (!post) {
      res.status(400).json({ message: "Post is not found" });
      return;
    }

    if (!name) {
      res.status(400).json({ message: "Please enter your name" });
      return;
    } else if (!dateandtime) {
      res.status(400).json({ message: "Please select date & time" });
      return;
    } else if (!title) {
      res.status(400).json({ message: "Please enter a title" });
      return;
    } else if (!tag) {
      res.status(400).json({ message: "Please add a tag" });
      return;
    }
    const postDate = new Date(dateandtime).getTime();
    if (postDate < Date.now()) {
    res.status(400).json({ message: "Date is not valid" });
    return;
    }

    let media;
    const mediaPostId = new mongoose.Types.ObjectId(postId as string);
    media = await Media.findOne({ post: mediaPostId });
    if (req.file) {
      const { filename, mimetype } = req.file;
      media = await Media.findByIdAndUpdate(
            media._id,
            { url: filename, type: mimetype.split('/')[1], },
            { new: true }
          );
    }

    const updatePost = await Post.findByIdAndUpdate(postId, req.body, {
      new: true,
    });
    res
      .status(200)
      .json({ message: "Post updated successfully", updatePost, media });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const deletePost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ message: "PostId is require" });
      return;
    }

    const mediaPostId = new mongoose.Types.ObjectId(postId);
    await Media.findOneAndDelete({ post: mediaPostId });
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post is deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const getAllPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, search } = req.query;
    let post;
    let filter: any = {};

    const skip: number = parseInt(req.query.skip as string); 
    const limit: number = parseInt(req.query.limit as string); 
    const skipPost = (skip - 1) * limit;

    if (search && status) {
      filter.$and = [
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { tag:  { $elemMatch: { $regex: search, $options: "i" } } },
          ]
        },
        { status }
      ];
    }else if(search){
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tag:  { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }else if (status && status === PostStatus.PUBLISHED) {
      filter.status = status;
    }

    const totalPosts = await Post.countDocuments(filter);

    post = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skipPost)
      .limit(limit)
      .populate({
        path: "media",
        model: "Media",
      });

      setTimeout(() => {
        res.status(200).json({
          totalPosts,
          post,
        });
      },2000)
 
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const getPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ message: "PostId is require" });
      return;
    }

    const mediaPostId = new mongoose.Types.ObjectId(postId);
    const media = await Media.findOne({ post: mediaPostId });
    const post = await Post.findById(postId);

    res.status(200).json({ message: "Post is Found." ,post, media });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};