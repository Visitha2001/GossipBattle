import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { User } from "@/lib/models/User";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    await connectDB();

    if (!q) {
      const cookieStore = await cookies();
      const token = cookieStore.get("auth_token")?.value;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as any;
          const currentUser = await User.findById(decoded.userId).populate("following followers", "name handle avatar handleColor");
          if (currentUser) {
            const combined = [...(currentUser.following || []), ...(currentUser.followers || [])] as any[];
            const unique = Array.from(new Set(combined.map(u => u._id.toString())))
              .map(id => combined.find(u => u._id.toString() === id))
              .slice(0, 5);
            return NextResponse.json(unique);
          }
        } catch (e) {}
      }
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
