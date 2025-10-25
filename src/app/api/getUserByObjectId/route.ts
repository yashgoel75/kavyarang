import { NextResponse } from "next/server";
import { User } from "../../../../db/schema";
import { register } from "@/instrumentation";

export async function GET(req: Request) {
  await register();

  const { searchParams } = new URL(req.url);
  const objectId = searchParams.get("objectId");

  if (!objectId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const user = await User.findById(objectId).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
