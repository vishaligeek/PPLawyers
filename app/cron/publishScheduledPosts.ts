import cron from "node-cron";
import Post from "../db/models/post";
import { DateTime } from "luxon";
import { PostStatus } from "../types/postTypes";

export const publishScheduledPosts = () => {
  cron.schedule("0 */12 * * *", async () => {
    try {
      const nowISO = DateTime.now().setZone("Australia/Sydney").toISO();
      const postsToPublish = await Post.find({
        status: PostStatus.SCHEDULED,
        date: { $lte: nowISO },
      });

      if (postsToPublish.length > 0) {
        for (const post of postsToPublish) {
          post.status = PostStatus.PUBLISHED;
          await post.save();
          console.log(`Post titled "${post._id}" has been published.`);
        }
      }
    } catch (error) {
      console.error("Error publishing scheduled posts:", error);
    }
  });
};
