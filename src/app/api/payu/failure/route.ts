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

        return new NextResponse(
            `
    <html>
      <head>
        <title>Failure</title>
        <script>
          // Redirect after 3 seconds
          setTimeout(() => {
            window.location.href = "/competitions/${productinfo}";
          }, 3000);
        </script>
      </head>
      <body style="font-family: sans-serif;">
        <h1>Payment Failed. Any amount deducted will be refunded in the original payment method used within 3-5 business days.</h1>
        <p>To participate, kindly try to register again</p>
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
