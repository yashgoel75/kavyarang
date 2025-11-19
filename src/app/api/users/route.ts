// app/api/users/route.ts
import { NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../db/schema";

export async function GET() {
  try {
    await register();

    // Only return essential public profile fields
    const users = await User.find(
      {},
      "name username bio profilePicture"
    );

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
