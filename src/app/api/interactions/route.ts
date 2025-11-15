import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../db/schema";

interface UserDocument {
  likes?: string[];
  bookmarks?: string[];
}

function paginate(array: string[], page: number, limit: number) {
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: array.slice(start, end),
    total: array.length,
    hasMore: end < array.length,
  };
}

export async function GET(req: NextRequest) {
  try {
    await register();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const postIdsParam = searchParams.get("postIds");

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userObj = user as UserDocument;
    const postIds: string[] = postIdsParam ? JSON.parse(postIdsParam) : [];

    const likesAll = (userObj.likes || []).filter(id => postIds.includes(id));
    const bookmarksAll = (userObj.bookmarks || []).filter(id =>
      postIds.includes(id)
    );

    const likes = paginate(likesAll, page, limit);
    const bookmarks = paginate(bookmarksAll, page, limit);

    return NextResponse.json(
      {
        likes: likes.data,
        bookmarks: bookmarks.data,
        totalLikes: likes.total,
        totalBookmarks: bookmarks.total,
        hasMoreLikes: likes.hasMore,
        hasMoreBookmarks: bookmarks.hasMore,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error checking interactions:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await register();
    const body = await req.json();
    const { email, postIds, page = 1, limit = 10 } = body;

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

    const likesAll = (userObj.likes || []).filter(id =>
      postIds.includes(id)
    );
    const bookmarksAll = (userObj.bookmarks || []).filter(id =>
      postIds.includes(id)
    );

    const likes = paginate(likesAll, page, limit);
    const bookmarks = paginate(bookmarksAll, page, limit);

    return NextResponse.json(
      {
        likes: likes.data,
        bookmarks: bookmarks.data,
        totalLikes: likes.total,
        totalBookmarks: bookmarks.total,
        hasMoreLikes: likes.hasMore,
        hasMoreBookmarks: bookmarks.hasMore,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error checking interactions (POST):", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
