import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { User } from "@/lib/models/User";
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
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find users that the current user is NOT following, excluding themselves
    const followingIds = currentUser.following || [];
    const suggestions = await User.find({
      _id: { $nin: [...followingIds, currentUser._id] }
    })
      .select("name handle avatar handleColor followers")
      .limit(5);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
