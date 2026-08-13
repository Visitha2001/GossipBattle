import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Group } from "@/lib/models/Group";
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

    // Add the current user to the group
    if (!group.members.includes(decoded.userId)) {
      group.members.push(decoded.userId);
      await group.save();
    }

    return NextResponse.json({ message: "Joined group successfully" });
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // The user leaving themselves, or an admin removing someone
    if (decoded.userId !== targetUserId && group.admin.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (group.admin.toString() === targetUserId) {
       return NextResponse.json({ error: "Admin cannot leave group, delete it instead" }, { status: 400 });
    }

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== targetUserId
    );
    await group.save();

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member from group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
