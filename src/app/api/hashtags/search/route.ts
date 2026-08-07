import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Hashtag } from "@/lib/models/Hashtag";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json([]);
    }

    await connectDB();
    const tags = await Hashtag.find({
      name: { $regex: `^${q}`, $options: "i" }
    })
      .sort({ count: -1 })
      .limit(5);

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error searching hashtags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
