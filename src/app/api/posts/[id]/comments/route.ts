import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Comment } from "@/lib/models/Comment";
import { Post } from "@/lib/models/Post";
import { User } from "@/lib/models/User";
import { Notification } from "@/lib/models/Notification";
import jwt from "jsonwebtoken";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const comments = await Comment.find({ post: id })
      .populate("author", "name handle avatar handleColor")
      .sort({ createdAt: 1 }); // chronological order

    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await connectDB();
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { content, side, parentComment } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const comment = await Comment.create({
      content,
      side: side || "none",
      author: decoded.userId,
      post: id,
      parentComment: parentComment || null,
    });

    // Increment comment count on the post
    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    await comment.populate("author", "name handle avatar handleColor");

    // Parse mentions (e.g. @username)
    const mentionRegex = /@(\w+)/g;
    let match;
    const mentionedHandles: string[] = [];
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedHandles.push(match[1]);
    }

    if (mentionedHandles.length > 0) {
      const mentionedUsers = await User.find({ handle: { $in: mentionedHandles } });
      for (const mUser of mentionedUsers) {
        if (mUser._id.toString() !== decoded.userId) {
          await Notification.create({
            user: mUser._id,
            actor: decoded.userId,
            type: "mention",
            post: id,
          });
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
