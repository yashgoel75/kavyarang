import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../../db/schema";

interface Notification {
  type: string;
  fromEmail: string;
  postId?: string;
  read: boolean;
  createdAt: Date;
}

interface UserType {
  notifications?: Notification[];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email) 
    return NextResponse.json({ error: "Email required" }, { status: 400 });

  try {
    await register();

    const user = await User.findOne({ email }) as (typeof User & { notifications?: Notification[] }) | null;

    if (!user) 
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updatedNotifications = (user.notifications || []).map((n: Notification) => ({
      ...n,
      read: true,
    }));

    await User.updateOne({ email }, { $set: { notifications: updatedNotifications } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
