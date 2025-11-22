import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "../../../../db/schema";
import { register } from "@/instrumentation";
import redis from "@/lib/redis";

export async function GET(req: Request) {
    await register();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "9", 10);

    const skip = (page - 1) * limit;

    const cacheKey = `posts:page:${page}:limit:${limit}`;

    const cached = await redis.get(cacheKey);
    // if (cached) {
    //   return NextResponse.json(cached);
    // }

    const posts = await Post.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name username email profilePicture")
        .select("title content picture author likes comments color createdAt")
        .lean();

    const total = await Post.countDocuments();

    const response = {
        posts,
        total,
        hasMore: skip + limit < total,
    };

    await redis.set(cacheKey, response, { ex: 300 });

    return NextResponse.json(response);
}
