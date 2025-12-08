import { NextResponse } from "next/server";
import { Competition } from "../../../../../db/schema";
import { register } from "@/instrumentation";

// ---------------------------------------------------------
// GET SINGLE COMPETITION BY ID
// ---------------------------------------------------------
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await register();

    const comp = await Competition.findById(params.id).lean();

    if (!comp) {
      return NextResponse.json(
        { success: false, error: "Competition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comp,
    });
  } catch (error: any) {
    console.error("Error fetching single competition:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Server error",
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------
// (OPTIONAL) UPDATE COMPETITION (FOR ADMIN)
// ---------------------------------------------------------
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await register();
    const body = await req.json();

    const updated = await Competition.findByIdAndUpdate(params.id, body, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Competition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Update competition error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------
// (OPTIONAL) DELETE COMPETITION
// ---------------------------------------------------------
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await register();

    const deleted = await Competition.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Competition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("Delete competition error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
