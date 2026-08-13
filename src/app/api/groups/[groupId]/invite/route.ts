import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Group } from "@/lib/models/Group";
import { User } from "@/lib/models/User";
import { Notification } from "@/lib/models/Notification";
import jwt from "jsonwebtoken";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
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

    const { groupId } = await params;
    await connectDB();

    const group = await Group.findById(groupId);
    
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Ensure the target is actually a follower of the current user (the inviter)
    // Here we can either enforce that the actor is a member of the group, etc.
    if (!group.members.includes(decoded.userId)) {
        return NextResponse.json({ error: "Forbidden: You must be a member to invite" }, { status: 403 });
    }

    if (group.members.includes(targetUserId)) {
        return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    // Create Notification
    await Notification.create({
      user: targetUserId,
      actor: decoded.userId,
      type: "group_invite",
      group: group._id,
    });

    return NextResponse.json({ message: "Invite sent successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error sending invite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
