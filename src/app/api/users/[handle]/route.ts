import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/lib/models/User";
import { Post } from "@/lib/models/Post";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    await connectDB();
    const { handle } = await params;
    
    // Support finding by ID or handle
    const decodedHandle = decodeURIComponent(handle);
    const isId = mongoose.Types.ObjectId.isValid(decodedHandle);
    const query = isId ? { _id: decodedHandle } : { handle: decodedHandle };
    
    const profileUser = await User.findOne(query)
      .populate("followers", "name handle avatar handleColor")
      .populate("following", "name handle avatar handleColor");

    if (!profileUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get posts by author
    const authoredPosts = await Post.find({ author: profileUser._id })
      .populate("author", "name handle avatar handleColor")
      .sort({ createdAt: -1 });

    // Get posts mentioning the user (simple regex for @handle)
    const mentionRegex = new RegExp(`@${profileUser.handle}\\b`, 'i');
    const mentionedPosts = await Post.find({ 
      content: { $regex: mentionRegex },
      author: { $ne: profileUser._id } // exclude self-authored to avoid duplicates
    })
      .populate("author", "name handle avatar handleColor")
      .sort({ createdAt: -1 });

    // Combine and sort
    const allPosts = [...authoredPosts, ...mentionedPosts].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return NextResponse.json({
      user: profileUser,
      posts: allPosts
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ handle: string }> }
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

    const { handle } = await params;
    await connectDB();

    const decodedHandle = decodeURIComponent(handle);
    const query = mongoose.Types.ObjectId.isValid(decodedHandle) ? { _id: decodedHandle } : { handle: decodedHandle };
    const targetUser = await User.findOne(query);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser._id.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Unauthorized to edit this profile" }, { status: 403 });
    }

    const data = await req.json();
    const updates: any = {};
    
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.coverPhoto !== undefined) updates.coverPhoto = data.coverPhoto;
    if (data.avatar !== undefined) updates.avatar = data.avatar;
    if (data.name !== undefined) updates.name = data.name;

    const updatedUser = await User.findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
