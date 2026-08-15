import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Group } from "@/lib/models/Group";
import { Post } from "@/lib/models/Post";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
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

    // Find all groups the user has joined or created
    const userGroups = await Group.find({
      $or: [
        { admin: decoded.userId },
        { members: decoded.userId }
      ]
    }).select("_id");

    const groupIds = userGroups.map(g => g._id);

    if (groupIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch posts created in any of these groups
    const posts = await Post.find({
      group: { $in: groupIds }
    })
      .populate("author", "name handle avatar handleColor")
      .populate("group", "name category profileImage coverImage")
      .sort({ createdAt: -1 });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching group feed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
