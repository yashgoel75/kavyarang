import { NextRequest, NextResponse } from "next/server";
import { User } from "../../../../db/schema";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing token" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];
        const decodedToken = await verifyFirebaseToken(token);
        if (!decodedToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await User.findOne(
            { email },
            {
                defaultPostColor: 1
            }
        ).lean();

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    }
    catch {
        return NextResponse.json("Error");
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing token" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];
        const decodedToken = await verifyFirebaseToken(token);
        if (!decodedToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await req.json();
        const { email, defaultPostColor } = body;

        if (!email || !defaultPostColor) {
            return NextResponse.json(
                { error: "Email and defaultPostColor are required" },
                { status: 400 }
            );
        }

        const updated = await User.findOneAndUpdate(
            { email },
            { defaultPostColor },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Default post color updated successfully",
            user: updated,
        });
    } catch (err) {
        console.error("PATCH /api/user/color error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}