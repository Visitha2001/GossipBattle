import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const body = await req.json();
    const { handle, handleColor } = body;

    if (!handle || !handle.startsWith("@")) {
      return NextResponse.json({ message: "Handle must start with @" }, { status: 400 });
    }

    if (!handleColor || handleColor.toLowerCase() === "#ffffff" || handleColor.toLowerCase() === "#000000" || handleColor.toLowerCase() === "#fff" || handleColor.toLowerCase() === "#000") {
      return NextResponse.json({ message: "Invalid handle color" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if handle is already taken by someone else
    const existingHandle = await User.findOne({ handle, _id: { $ne: decoded.userId } });
    if (existingHandle) {
      return NextResponse.json({ message: "Handle already taken" }, { status: 409 });
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { handle, handleColor },
      { new: true }
    ).select("-googleId");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        handle: user.handle,
        handleColor: user.handleColor,
      }
    });

  } catch (error) {
    console.error("Onboarding Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
