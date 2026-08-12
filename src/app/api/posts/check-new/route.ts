import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Post } from "@/lib/models/Post";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    
    if (!since) {
      return NextResponse.json({ hasNew: false });
    }

    await connectDB();
    const count = await Post.countDocuments({ 
      createdAt: { $gt: new Date(Number(since)) } 
    });

    return NextResponse.json({ hasNew: count > 0 });
  } catch (error) {
    return NextResponse.json({ hasNew: false });
  }
}
