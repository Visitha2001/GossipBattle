import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Comment } from "@/lib/models/Comment";
import { Notification } from "@/lib/models/Notification";
import { sseEmitter } from "@/lib/eventEmitter";
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

    const { voteType } = await req.json(); // "W" or "L"
    if (!["W", "L"].includes(voteType)) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    const { id } = await params;
    await connectDB();
    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(decoded.userId);
    const upvoteIndex = comment.upvotes.findIndex((id) => id.equals(userId));
    const downvoteIndex = comment.downvotes.findIndex((id) => id.equals(userId));

    if (voteType === "W") {
      if (upvoteIndex > -1) {
        comment.upvotes.splice(upvoteIndex, 1);
      } else {
        comment.upvotes.push(userId);
        if (downvoteIndex > -1) comment.downvotes.splice(downvoteIndex, 1);
        
        // Notification for 'like'
        if (comment.author.toString() !== userId.toString()) {
          const notif = await Notification.create({
            user: comment.author,
            actor: userId,
            type: "like",
            post: comment.post,
            comment: comment._id,
          });
          const populatedNotif = await notif.populate("actor", "name handle avatar handleColor");
          sseEmitter.emit("notification", comment.author.toString(), populatedNotif);
        }
      }
    } else {
      if (downvoteIndex > -1) {
        comment.downvotes.splice(downvoteIndex, 1);
      } else {
        comment.downvotes.push(userId);
        if (upvoteIndex > -1) comment.upvotes.splice(upvoteIndex, 1);
      }
    }

    await comment.save();

    return NextResponse.json({ 
      upvotes: comment.upvotes.length, 
      downvotes: comment.downvotes.length,
      hasUpvoted: comment.upvotes.findIndex((id) => id.equals(userId)) > -1,
      hasDownvoted: comment.downvotes.findIndex((id) => id.equals(userId)) > -1,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
