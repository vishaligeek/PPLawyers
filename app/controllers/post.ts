import { Request, Response } from "express";
import Post from "../db/models/post";
import Media from "../db/models/media";
import mongoose from "mongoose";
import { PostStatus } from "../types/postTypes";

export const createPost = async (req, res: Response): Promise<void> => {
  try {
    const { name, dateandtime, title, tag, description, status } = req.body;
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
    } else if (!description) {
      res.status(400).json({ message: "Please add a description" });
      return;
    } else if (!req.file) {
      res.status(400).json({ message: "Please add a image" });
      return;
    }
    const postDate = new Date(dateandtime).getTime();
    if (postDate < Date.now()) {
      res
        .status(400)
        .json({
          message: "The scheduled date and time must be in the future.",
        });
      return;
    }

    const newPost = await Post.create({
      name,
      dateandtime,
      title,
      tag,
      description,
      status,
      user: req.user._id,
      createdAt: new Date(),
    });

    if (req.file) {
      const { filename, mimetype } = req.file;
      media = await Media.create({
        post: newPost._id,
        url: filename,
        type: mimetype.split("/")[1],
      });
    }

    res.status(201).json({
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
    const { name, dateandtime, title, tag, description, status } = req.body;
    const { postId } = req.params;

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
    } else if (!description) {
      res.status(400).json({ message: "Please add a description" });
      return;
    } else if (!req.file) {
      res.status(400).json({ message: "Please add a image" });
      return;
    }

    const postDate = new Date(dateandtime).getTime();
    if (postDate < Date.now()) {
      res
        .status(400)
        .json({
          message: "The scheduled date and time must be in the future.",
        });
      return;
    }

    let media;
    const mediaPostId = new mongoose.Types.ObjectId(postId as string);
    media = await Media.findOne({ post: mediaPostId });
    if (req.file) {
      const { filename, mimetype } = req.file;
      media = await Media.findByIdAndUpdate(
        media._id,
        { url: filename, type: mimetype.split("/")[1] },
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
    const cleanedSearch = search && search.toString().trim();
    const isEmptySearch =
      !cleanedSearch || cleanedSearch === '""' || cleanedSearch === "''";

    const finalSearch = isEmptySearch ? "" : cleanedSearch;
    let post;
    let filter: any = {};

    const skip: number = parseInt(req.query.skip as string);
    const limit: number = parseInt(req.query.limit as string);
    const skipPost = (skip - 1) * limit;

    if (finalSearch && status) {
      filter.$and = [
        {
          $or: [
            { name: { $regex: finalSearch, $options: "i" } },
            { title: { $regex: finalSearch, $options: "i" } },
            { description: { $regex: finalSearch, $options: "i" } },
            { tag: { $elemMatch: { $regex: finalSearch, $options: "i" } } },
          ],
        },
        { status },
      ];
    } else if (finalSearch) {
      filter.$or = [
        { name: { $regex: finalSearch, $options: "i" } },
        { title: { $regex: finalSearch, $options: "i" } },
        { description: { $regex: finalSearch, $options: "i" } },
        { tag: { $elemMatch: { $regex: finalSearch, $options: "i" } } },
      ];
    } else if (status && status === PostStatus.PUBLISHED) {
      filter.status = status;
    }

    function splitArray(array, size) {
      let result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    }

    if (finalSearch.length > 0) {
      const totalPosts = await Post.countDocuments(filter);
      post = await Post.find(filter).sort({ createdAt: -1 }).populate({
        path: "media",
        model: "Media",
      });

      if (post.length > limit) {
        post = splitArray(post, limit)[skip - 1];
      } else {
        post = splitArray(post, limit)[0];
      }

      res.status(200).json({
        totalPosts,
        post,
      });
      return;
    } else {
      const totalPosts = await Post.countDocuments();
      post = await Post.find()
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
      }, 2000);
      return;
    }
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ message: "PostId is require" });
      return;
    }

    const post = await Post.findById(postId).populate({
      path: "media",
      model: "Media",
    });

    res.status(200).json({ message: "Post is Found.", post });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
