import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Post } from "@/lib/models/Post";
import { Group } from "@/lib/models/Group";
import jwt from "jsonwebtoken";

export async function GET(
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

    // Only members can view posts
    if (!group.members.includes(decoded.userId) && group.admin.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden: Not a member" }, { status: 403 });
    }

    const posts = await Post.find({ group: groupId })
      .populate("author", "name handle avatar handleColor")
      .populate("group", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching group posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
