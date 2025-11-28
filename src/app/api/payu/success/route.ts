import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const status = formData.get("status") as string;
    const productinfo = formData.get("productinfo") as string;
    const email = formData.get("email") as string;

    if (!status || !productinfo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(status);
    console.log(email);
    console.log(productinfo);
    try {
      await fetch(`${new URL(req.url).origin}/api/competitions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: productinfo,
          email: email
        }),
      });
    } catch (patchErr) {
      console.error("Failed to update participant:", patchErr);
    }

    return new NextResponse(
      `
    <html>
      <head>
        <title>Success</title>
        <script>
          // Redirect after 3 seconds
          setTimeout(() => {
            window.location.href = "/competitions/${productinfo}";
          }, 3000);
        </script>
      </head>
      <body style="font-family: sans-serif;">
        <h1>Payment Successful</h1>
        <p>You are now registered for the competition.</p>
        <p>Redirecting you to the competition page...</p>
      </body>
    </html>
  `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );


  } catch (err: unknown) {
    console.error("PayU Success Error:", err);
    return NextResponse.json(
      "Error"
    );
  }
}
