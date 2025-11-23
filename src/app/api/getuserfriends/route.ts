import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../db/schema";

export async function GET(req: NextRequest) {
  try {
    await register();
    const { searchParams } = new URL(req.url);

    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne(
      { email },
      {
        name: 1,
        username: 1,
        email: 1,
        profilePicture: 1,
        isVerified: 1,
        followers: 1,
        following: 1,
      }
    ).lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error("Error fetching user basic info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
