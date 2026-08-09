import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Post } from "@/lib/models/Post";
import { Notification } from "@/lib/models/Notification";
import { sseEmitter } from "@/lib/eventEmitter";
import jwt from "jsonwebtoken";

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

    // Notification for 'share'
    if (post.author.toString() !== decoded.userId) {
      const notif = await Notification.create({
        user: post.author,
        actor: decoded.userId,
        type: "share",
        post: post._id,
      });
      const populatedNotif = await notif.populate("actor", "name handle avatar handleColor");
      sseEmitter.emit("notification", post.author.toString(), populatedNotif);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
