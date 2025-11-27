import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../../db/schema";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

interface Notification {
  type: string;
  fromEmail: string;
  postId?: string;
  read: boolean;
  createdAt: Date;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email) 
    return NextResponse.json({ error: "Email required" }, { status: 400 });

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

    const user = await User.findOne({ email }) as (typeof User & { notifications?: Notification[] }) | null;

    if (!user) 
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await User.updateOne({ email }, { $set: { notifications: [] } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
