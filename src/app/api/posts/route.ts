import { NextResponse } from "next/server";
import { Post } from "../../../../db/schema";
import { register } from "@/instrumentation";

export async function GET(req: Request) {
  await register();

  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");

  if (!ids) {
    return NextResponse.json({ error: "No post IDs provided" }, { status: 400 });
  }

  try {
    const postIds = ids.split(",");
    const posts = await Post.find({ _id: { $in: postIds } }).lean();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
