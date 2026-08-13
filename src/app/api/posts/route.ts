import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Post } from "@/lib/models/Post";
import { User } from "@/lib/models/User";
import { Hashtag } from "@/lib/models/Hashtag";
import { Notification } from "@/lib/models/Notification";
import jwt from "jsonwebtoken";
import { getFeedPosts } from "@/lib/feedAlgorithm";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    let userId: string | undefined;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as any;
        userId = decoded.userId;
      } catch (e) {
        // invalid token
      }
    }

    await connectDB();
    const posts = await getFeedPosts(userId);

    // Populate group field for each post
    await Post.populate(posts, { path: "group", select: "name icon" });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "");
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { content, imageUrls, feeling, group } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const post = await Post.create({
      content,
      imageUrls,
      feeling,
      author: user._id,
      group: group || null,
    });

    // Parse Hashtags
    const hashtags = content.match(/#(\w+)/g);
    if (hashtags && hashtags.length > 0) {
      const uniqueHashtags = [...new Set(hashtags.map((h: string) => h.slice(1).toLowerCase()))] as string[];
      const hashtagOps = uniqueHashtags.map((tag) => ({
        updateOne: {
          filter: { name: tag },
          update: { $inc: { count: 1 } },
          upsert: true,
        },
      }));
      await Hashtag.bulkWrite(hashtagOps as any);
    }

    // Parse Mentions
    const mentions = content.match(/@(\w+)/g);
    if (mentions && mentions.length > 0) {
      const uniqueHandles = [...new Set(mentions)] as string[];
      const mentionedUsers = await User.find({ handle: { $in: uniqueHandles } });
      
      const notifications = mentionedUsers
        .filter(u => u._id.toString() !== user._id.toString())
        .map(u => ({
          user: u._id,
          actor: user._id,
          type: "mention",
          post: post._id,
        }));
        
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    await post.populate("author", "name handle avatar handleColor");

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
