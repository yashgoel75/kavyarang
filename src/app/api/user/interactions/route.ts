import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../../db/schema";

interface UserDocument {
  name: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  posts?: string[];
  likes?: string[];
  bookmarks?: string[];
  snapchat: string;
  instagram: string;
  followers: string[];
  following: string[];
}

export async function GET(req: NextRequest) {
  try {
    await register();
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const email = searchParams.get("email");

    if (!postId || !email) {
      return NextResponse.json(
        { error: "Post ID and email are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).lean();

    if (!user || (Array.isArray(user) && user.length === 0)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDoc = (Array.isArray(user) ? user[0] : user) as unknown as UserDocument;

    const isLiked = userDoc.likes?.includes(postId) || false;
    const isBookmarked = userDoc.bookmarks?.includes(postId) || false;

    return NextResponse.json({ isLiked, isBookmarked }, { status: 200 });
  } catch (error) {
    console.error("Error checking interactions:", error);
    return NextResponse.json(
      { error: "Failed to check interactions" },
      { status: 500 }
    );
  }
}