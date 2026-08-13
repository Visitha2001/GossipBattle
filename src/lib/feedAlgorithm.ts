import { Post } from "./models/Post";
import { Group } from "./models/Group";

export async function getFeedPosts(userId?: string) {
  let userGroupIds: any[] = [];
  if (userId) {
    const groups = await Group.find({ members: userId }).select("_id").lean();
    userGroupIds = groups.map(g => g._id);
  }

  // Fetch a pool of recent posts
  const posts = await Post.find({
    $or: [
      { group: { $exists: false } },
      { group: null },
      ...(userGroupIds.length > 0 ? [{ group: { $in: userGroupIds } }] : [])
    ]
  })
    .populate("author", "name handle avatar handleColor")
    .populate("group", "name")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean(); // Plain JS objects

  if (!posts || posts.length === 0) return [];

  // Determine how many newest posts to show based on total posts fetched
  // e.g. <20 -> 5, 20-39 -> 7, 40-59 -> 9, >=60 -> 11
  let newestCount = 5;
  if (posts.length >= 20) newestCount = 7;
  if (posts.length >= 40) newestCount = 9;
  if (posts.length >= 60) newestCount = 11;

  // 1. Take the newest posts (already sorted by createdAt DESC)
  const topNewest = posts.slice(0, newestCount);
  const remainingPosts = posts.slice(newestCount);

  const currentUserPosts: any[] = [];
  const otherPosts: any[] = [];

  for (const post of remainingPosts) {
    // Check if the post belongs to the current user
    if (userId && post.author && post.author._id.toString() === userId.toString()) {
      currentUserPosts.push(post);
    } else {
      otherPosts.push(post);
    }
  }

  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // 2. Sort other posts by engagement (views + upvotes) DESC
  // Do not boost posts older than 5 days based on engagement
  otherPosts.sort((a, b) => {
    let scoreA = (a.views || 0) + (a.upvotes?.length || 0);
    let scoreB = (b.views || 0) + (b.upvotes?.length || 0);
    
    const isAOld = (now - new Date(a.createdAt).getTime()) > FIVE_DAYS_MS;
    const isBOld = (now - new Date(b.createdAt).getTime()) > FIVE_DAYS_MS;

    if (isAOld) scoreA = -1; // Strip engagement score
    if (isBOld) scoreB = -1;

    // If scores are equal, sort by newest
    if (scoreA === scoreB) {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    }

    return scoreB - scoreA;
  });

  // 3. Sort current user's posts by updatedAt (or createdAt) DESC
  currentUserPosts.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt).getTime();
    return dateB - dateA; // DESC
  });

  // Combine them
  return [...topNewest, ...otherPosts, ...currentUserPosts];
}
