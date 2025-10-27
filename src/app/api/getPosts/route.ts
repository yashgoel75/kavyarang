import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "../../../../db/schema";
import { register } from "@/instrumentation";

interface Post {
    _id: string;
    title: string;
    content: string;
    picture?: string;
    likes: number;
    color: string;
}

export async function GET(req: Request) {
  await register();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "9", 10);

  const skip = (page - 1) * limit;

  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("author");

  const total = await Post.countDocuments();

  return NextResponse.json({
    posts,
    total,
    hasMore: skip + limit < total,
  });
}

