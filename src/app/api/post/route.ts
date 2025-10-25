import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { Post, User } from "../../../../db/schema";

export async function GET(req: NextRequest) {
  try {
    await register();

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const post = await Post.findById(postId)
      .populate("author", "name username email profilePicture")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name username email profilePicture",
        },
      })
      .lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}