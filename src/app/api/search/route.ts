import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "./../../../../db/schema";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const regex = new RegExp(query, "i");

    const users = await User.find({
      $or: [{ name: regex }, { username: regex }],
    }).select("_id name username profilePicture bio");

    const userIds = users.map((u) => u._id);

    const posts = await Post.find({
      $or: [
        { title: regex },
        { content: regex },
        { tags: regex },
        { author: { $in: userIds } },
      ],
    })
      .populate("author", "name username profilePicture")
      .select("title content picture tags author likes comments createdAt");

    return NextResponse.json({ users, posts });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
