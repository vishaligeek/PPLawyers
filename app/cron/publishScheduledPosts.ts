import cron from 'node-cron';
import Post  from '../db/models/post';
import { PostStatus } from '../types/postTypes';

export const publishScheduledPosts = () => {
  
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const utcDate = now.toISOString();

      const postsToPublish = await Post.find({
        status: PostStatus.SCHEDULED,
        dateandtime: { $lte : utcDate },
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
