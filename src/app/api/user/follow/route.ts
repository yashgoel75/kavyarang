import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../../db/schema";

export async function POST(req: NextRequest) {
    try {
        await register();

        const { currentUserEmail, targetEmail, action } = await req.json();

        if (!currentUserEmail || !targetEmail || !action) {
            return NextResponse.json(
                { error: "Current user email, target email, and action are required" },
                { status: 400 }
            );
        }

        if (currentUserEmail === targetEmail) {
            return NextResponse.json(
                { error: "You cannot follow yourself" },
                { status: 400 }
            );
        }

        const currentUser = await User.findOne({ email: currentUserEmail });
        const targetUser = await User.findOne({ email: targetEmail });

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === "follow") {
            await User.updateOne(
                { email: currentUserEmail },
                { $addToSet: { following: targetEmail } }
            );

            await User.updateOne(
                { email: targetEmail },
                { $addToSet: { followers: currentUserEmail } }
            );

            const notification = {
                id: new Date().getTime().toString(),
                type: "new_follower",
                fromEmail: currentUserEmail,
                read: false,
                createdAt: new Date(),
            };

            await User.updateOne(
                { email: targetEmail },
                { $push: { notifications: notification } }
            );

            return NextResponse.json(
                { message: "User followed successfully" },
                { status: 200 }
            );
        } else if (action === "unfollow") {
            await User.updateOne(
                { email: currentUserEmail },
                { $pull: { following: targetEmail } }
            );

            await User.updateOne(
                { email: targetEmail },
                { $pull: { followers: currentUserEmail } }
            );

            return NextResponse.json(
                { message: "User unfollowed successfully" },
                { status: 200 }
            );
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error following/unfollowing user:", error);
        return NextResponse.json(
            { error: "Failed to update follow status" },
            { status: 500 }
        );
    }
}
