import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Comment } from "@/lib/models/Comment";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(decoded.userId);
    const hasLiked = comment.likes?.includes(userId);

    if (hasLiked) {
      comment.likes = comment.likes.filter(
        (likeId) => likeId.toString() !== userId.toString()
      );
    } else {
      if (!comment.likes) comment.likes = [];
      comment.likes.push(userId);
    }

    await comment.save();

    return NextResponse.json({
      success: true,
      likes: comment.likes.length,
      isLiked: !hasLiked,
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
