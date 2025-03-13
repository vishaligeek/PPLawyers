import { Request, Response } from "express";
import Post from "../db/models/post";
import Media from "../db/models/media";
import mongoose from "mongoose";
import { PostStatus } from "../types/postTypes";
import { deleteFileFromGCP, uploadFileToGCP } from "../helpers/gcpStorage";

const parseDate = (inputDate: string): Date => {
  if (!isNaN(Date.parse(inputDate))) {
    return new Date(inputDate);
  }

  let [datePart, timePart] = inputDate.split(",").map((part) => part.trim());

  if (timePart) {
    timePart = timePart.toUpperCase();
  }

  const monthDayYearPattern = /^[a-zA-Z]+\s\d{1,2},\s\d{4}$/;
  if (monthDayYearPattern.test(datePart)) {
    const [monthName, day, year] = datePart.split(/[\s,]+/);
    const monthIndex = new Date(`${monthName} 1`).getMonth() + 1;
    datePart = `${day.padStart(2, "0")}/${monthIndex
      .toString()
      .padStart(2, "0")}/${year}`;
  }

  const isAMPMFormat = /AM|PM/.test(timePart);
  let dateObject;

  if (isAMPMFormat) {
    const [time, period] = timePart.split(" ");
    let [hours, minutes, seconds] = time.split(":").map(Number);

    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;

    const [day, month, year] = datePart.split("/");
    const formattedDate = `${year}-${month}-${day}T${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
    dateObject = new Date(formattedDate);
  } else {
    const [day, month, year] = datePart.split("/");
    const time = timePart || "00:00:00";
    const formattedDate = `${year}-${month}-${day}T${time}`;
    dateObject = new Date(formattedDate);
  }

  if (isNaN(dateObject.getTime())) {
    throw new Error("Invalid date format");
  }
  return dateObject;
};

const formatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Sydney",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const createPost = async (req, res: Response): Promise<void> => {
  try {
    const { name, date, title, tag, description, status } = req.body;

    if (!name) {
      res.status(400).json({ message: "Please enter your name." });
      return;
    }
    if (!date) {
      res.status(400).json({ message: "Please select date & time." });
      return;
    }
    if (!title) {
      res.status(400).json({ message: "Please enter a title." });
      return;
    }
    if (!tag) {
      res.status(400).json({ message: "Please add a tag." });
      return;
    }
    if (!description) {
      res.status(400).json({ message: "Please add a description." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "Please add an image." });
      return;
    }

    const inputDate = parseDate(date);

    const day = inputDate.getDate().toString().padStart(2, "0");
    const month = (inputDate.getMonth() + 1).toString().padStart(2, "0");
    const year = inputDate.getFullYear().toString();

    const inputDateOnly = `${year}-${month}-${day}`;

    const today = new Date();
    const [todayDay, todayMonth, todayYear] = formatter
      .format(today)
      .split("/");

    const todayDateOnly = `${todayYear}-${todayMonth}-${todayDay}`;

    if (inputDateOnly < todayDateOnly) {
      res.status(400).json({
        message: "The scheduled date must be today or in the future.",
      });
      return;
    }

    const newPost = await Post.create({
      name,
      date: inputDateOnly,
      title,
      tag,
      description,
      status,
      user: req.user._id,
    });
    const { buffer, mimetype, originalname } = req.file;
    // console.log("-=-=-=-=",req.file)
    // const fileName = `${Date.now()}-${path.basename(originalname)}`;
    await uploadFileToGCP(buffer, originalname, mimetype);
    const media = await Media.create({
      post: newPost._id,
      imageName: originalname,
      type: mimetype,
    });

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
    const { postId } = req.params;
    const { name, date, title, tag, description, status, imageName } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      res.status(400).json({ message: "Post is not found." });
      return;
    }

    if (!name) {
      res.status(400).json({ message: "Please enter your name." });
      return;
    } else if (!date) {
      res.status(400).json({ message: "Please select date & time." });
      return;
    } else if (!title) {
      res.status(400).json({ message: "Please enter a title." });
      return;
    } else if (!tag) {
      res.status(400).json({ message: "Please add a tag." });
      return;
    } else if (!description) {
      res.status(400).json({ message: "Please add a description." });
      return;
    }

    const inputDate = parseDate(date);

    const day = inputDate.getDate().toString().padStart(2, "0");
    const month = (inputDate.getMonth() + 1).toString().padStart(2, "0");
    const year = inputDate.getFullYear().toString();

    const inputDateOnly = `${year}-${month}-${day}`;

    const today = new Date();
    const [todayDay, todayMonth, todayYear] = formatter
      .format(today)
      .split("/");

    const todayDateOnly = `${todayYear}-${todayMonth}-${todayDay}`;

    if (inputDateOnly < todayDateOnly) {
      res.status(400).json({
        message: "The scheduled date must be today or in the future.",
      });
      return;
    }

    let media;
    const mediaPostId = new mongoose.Types.ObjectId(postId as string);
    media = await Media.findOne({ post: mediaPostId });
    if (imageName) {
      media = await Media.findByIdAndUpdate(
        media._id,
        { imageName: imageName, updatedAt: new Date() },
        { new: true }
      );
    }
    if (!imageName) {
      if (!req.file) {
        res.status(400).json({ message: "Please add an image." });
        return;
      }
      const { buffer, mimetype, originalname } = req.file;
      // const fileName = `${Date.now()}-${req.file.originalname}`;
      if (media && media.imageName) {
        const oldFileName = media.imageName.split("/").pop();
        await deleteFileFromGCP(oldFileName);
      }
      await uploadFileToGCP(buffer, originalname, mimetype);
      media = await Media.findByIdAndUpdate(
        media._id,
        { imageName: originalname, type: mimetype, updatedAt: new Date() },
        { new: true }
      );
    }

    const updatePost = await Post.findByIdAndUpdate(
      postId,
      {
        name,
        date: inputDateOnly,
        title,
        tag,
        description,
        status,
        updatedAt: new Date(),
      },
      {
        new: true,
      }
    );

    res
      .status(200)
      .json({ message: "Post updated successfully.", updatePost, media });
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
      res.status(400).json({ message: "PostId is require." });
      return;
    }
    const post = await Post.findById(postId);
    if (!post) {
      res.status(400).json({ message: "Post is not found." });
      return;
    }

    const mediaPostId = new mongoose.Types.ObjectId(postId);
    const media = await Media.findOne({ post: mediaPostId });
    if (media && media.imageName) {
      const oldFileName = media.imageName.split("/").pop();
      await deleteFileFromGCP(oldFileName);
    }
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

    const page: number = parseInt(req.query.page as string);
    const limit: number = parseInt(req.query.limit as string);
    const skipPost = (page - 1) * limit;

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

    if (finalSearch.length > 0 || status) {
      const totalPosts = await Post.countDocuments(filter);
      post = await Post.find(filter)
        .sort({ date: -1, updatedAt: -1 })
        .populate({
          path: "media",
          model: "Media",
        });

      if (post.length > limit) {
        post = splitArray(post, limit)[page - 1];
      } else {
        post = splitArray(post, limit)[0];
      }
      if (!post || post.length === 0) {
        post = [];
      }

      res.status(200).json({
        totalPosts,
        post,
      });
      return;
    } else {
      const totalPosts = await Post.countDocuments();
      post = await Post.find()
        .sort({ date: -1, updatedAt: -1 })
        .skip(skipPost)
        .limit(limit)
        .populate({
          path: "media",
          model: "Media",
        });

      if (!post || post.length === 0) {
        post = [];
      }

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
      res.status(400).json({ message: "PostId is require." });
      return;
    }

    const post = await Post.findById(postId).populate({
      path: "media",
      model: "Media",
    });

    if (!post) {
      res.status(400).json({ message: "Post is not found." });
      return;
    }

    res.status(200).json({ message: "Post is Found.", post });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
