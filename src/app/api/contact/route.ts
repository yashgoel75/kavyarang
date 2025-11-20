import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, subject, body } = await req.json();

  try {
    await resend.emails.send({
      from: "Kavyalok <support@cleit.in>",
      to: email,
      subject: "We've received your message — Kavyalok Support",
      html: `
      <div style="background-color: #faf7f2; padding: 20px; font-family: Arial, sans-serif;">
        <div style="
          margin: auto; 
          background-color: white; 
          border-radius: 10px; 
          padding: 25px; 
          box-shadow: 0 4px 14px rgba(0,0,0,0.08); 
          max-width: 600px;
        ">

          <div style="text-align: center; margin-bottom: 25px;">
            <img src="https://kavyalok.in/logo.png"
                 alt="Kavyalok Logo"
                 style="width: 180px; height: auto;">
          </div>

          <h2 style="color: #2d2d2d; text-align: center; margin-bottom: 12px;">
            Hi ${name},
          </h2>

          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Thank you for contacting <strong>Kavyalok Support</strong>.  
            We've received your message and our team will get back to you shortly.
          </p>

          <div style="margin: 25px 0;">
            <h3 style="color: #2d2d2d; margin-bottom: 8px;">Your Message</h3>
            <p style="font-size: 15px;"><strong>Subject:</strong> ${subject}</p>

            <div style="
              background-color: #f0e7da; 
              padding: 14px 20px; 
              border-radius: 8px; 
              font-size: 14px; 
              color: #6a4b2f; 
              line-height: 1.6; 
              margin-top: 10px;
            ">
              ${body.replace(/\n/g, "<br>")}
            </div>
          </div>

          <p style="color: #999; font-size: 12px; text-align: left;">
            Thank you for being part of the Kavyalok community.  
            We appreciate your patience.
          </p>

          <p style="color: #2d2d2d; font-size: 14px; margin-top: 35px;">
            With warmth,<br>Team Kavyalok
          </p>

        </div>
      </div>
      `,
    });

    await resend.emails.send({
      from: "Kavyalok <support@cleit.in>",
      to: "yash.goel8370@gmail.com",
      subject: `New Contact Form Submission from ${name}`,
      html: `
      <div style="background-color: #faf7f2; padding: 20px; font-family: Arial, sans-serif;">
        <div style="
          margin: auto; 
          background-color: white; 
          border-radius: 10px; 
          padding: 25px; 
          max-width: 600px; 
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        ">

          <h2 style="color: #2d2d2d; margin-bottom: 20px;">
            📩 New Support Request
          </h2>

          <p style="font-size: 15px;"><strong>Name:</strong> ${name}</p>
          <p style="font-size: 15px;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 15px;"><strong>Subject:</strong> ${subject}</p>

          <div style="
            background-color: #f0e7da; 
            padding: 14px 20px; 
            border-radius: 8px; 
            font-size: 14px; 
            color: #6a4b2f; 
            line-height: 1.6; 
            margin-top: 12px;
          ">
            ${body.replace(/\n/g, "<br>")}
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 25px;">
            Submitted via the Kavyalok contact form.
          </p>

        </div>
      </div>
      `,
    });

    return NextResponse.json(
      { message: "Support message sent to user and admin" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
