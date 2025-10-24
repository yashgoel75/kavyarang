import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "../../../../../db/schema";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email query parameter is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const posts = await Post.find({ _id: { $in: user.posts } }).sort({ createdAt: -1 });

    return NextResponse.json({ user: { ...user.toObject(), posts } }, { status: 200 });
  } catch (err) {
    console.error("Error fetching user posts:", err);
    return NextResponse.json(
      { error: "Failed to fetch user posts" },
      { status: 500 }
    );
  }
}
