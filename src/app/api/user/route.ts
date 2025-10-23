import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { User } from "../../../../db/schema";

export async function GET(req: NextRequest) {
    try {
        await register();

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
            { name: name },
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