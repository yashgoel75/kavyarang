import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../db/schema";

interface UserDocument {
  likes?: string[];
  bookmarks?: string[];
}

export async function GET(req: NextRequest) {
  try {
    await register();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const postIdsParam = searchParams.get("postIds");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await User.findOne({ email }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userObj = (Array.isArray(user) ? user[0] : user) as UserDocument;

    const postIds: string[] = postIdsParam ? JSON.parse(postIdsParam) : [];

    const likes = (userObj.likes || []).filter((id: string) =>
      postIds.includes(id)
    );
    const bookmarks = (userObj.bookmarks || []).filter((id: string) =>
      postIds.includes(id)
    );

    return NextResponse.json({ likes, bookmarks }, { status: 200 });
  } catch (err) {
    console.error("Error checking interactions:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await register();
    const { email, postIds } = await req.json();

    if (!email || !Array.isArray(postIds)) {
      return NextResponse.json(
        { error: "Email and postIds are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userObj = user as UserDocument;

    const likes = (userObj.likes || []).filter((id: string) =>
      postIds.includes(id)
    );
    const bookmarks = (userObj.bookmarks || []).filter((id: string) =>
      postIds.includes(id)
    );

    return NextResponse.json({ likes, bookmarks }, { status: 200 });
  } catch (err) {
    console.error("Error checking interactions (POST):", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}