import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/lib/models/User";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json([]);
    }

    await connectDB();
    const users = await User.find({
      $or: [
        { handle: { $regex: `^@?${q}`, $options: "i" } },
        { name: { $regex: `^${q}`, $options: "i" } }
      ]
    })
      .select("name handle avatar handleColor")
      .limit(5);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
