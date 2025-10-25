import { NextRequest, NextResponse } from "next/server";
import { User, Post } from "../../../../db/schema";

interface Post {
    _id: string;
    title: string;
    content: string;
    picture?: string;
    likes: number;
    color: string;
}

export async function GET() {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return NextResponse.json({ posts }, { status: 200 });
    } catch (err) {
        console.error("Error fetching user posts:", err);
        return NextResponse.json(
            { error: "Failed to fetch user posts" },
            { status: 500 }
        );
    }
}

