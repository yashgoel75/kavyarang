import { NextRequest, NextResponse } from "next/server";
import { User } from "../../../../db/schema";
import { register } from "@/instrumentation";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function POST(req: NextRequest) {
  try {
    await register();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: "Emails array is required" },
        { status: 400 }
      );
    }

    if (emails.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const users = await User.find(
      { email: { $in: emails } },
      {
        name: 1,
        username: 1,
        profilePicture: 1,
        email: 1,
      }
    ).lean();

    return NextResponse.json({ users }, { status: 200 });

  } catch (error) {
    console.error("Error in batch user lookup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
