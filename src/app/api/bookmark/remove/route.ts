import { NextResponse } from "next/server";
import { User } from "../../../../../db/schema";
import { register } from "@/instrumentation";

export async function POST(req: Request) {
  await register();

  const { email, postId } = await req.json();

  if (!email || !postId) {
    return NextResponse.json({ error: "Email and postId required" }, { status: 400 });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $pull: { bookmarks: postId } },
      { new: true }
    ).lean();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
