import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { User } from "@/lib/models/User";
import { Notification } from "@/lib/models/Notification";
import jwt from "jsonwebtoken";

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
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID required" }, { status: 400 });
    }

    if (targetUserId === currentUser._id.toString()) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const isFollowing = currentUser.following?.includes(targetUser._id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { following: targetUser._id }
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $pull: { followers: currentUser._id }
      });
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUser._id, {
        $addToSet: { following: targetUser._id }
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $addToSet: { followers: currentUser._id }
      });

      // Create notification
      await Notification.create({
        user: targetUser._id,
        actor: currentUser._id,
        type: "follow",
      });

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
