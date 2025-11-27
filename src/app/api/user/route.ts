import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../db/schema";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function GET(req: NextRequest) {
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

        const email = req.nextUrl.searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ email });
        const name = existingUser.name;

        return NextResponse.json(
            { name: name, user: existingUser },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Error checking email:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { email, updates } = body;

    const updatedUser = await User.findOneAndUpdate(
        { email: email },
        updates,
        { new: true }
    );

    return NextResponse.json({ success: true, user: updatedUser });
}