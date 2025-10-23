import redis from '@/lib/redis';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await redis.set(`otp:${email}`, otp, { ex: 300 });

  try {
    const { data } = await resend.emails.send({
      from: "Kavyansh <noreply@cleit.in>",
      to: email,
      subject: "Welcome to Kavyansh - OTP Verification",
      html: `
      <div style="background-color: #faf7f2; padding: 20px; font-family: Arial, sans-serif;">
      
    </style>
        <div style="margin: auto; background-color: white; border-radius: 10px; padding: 25px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); max-width: 600px;">
          
          <div style="text-align: center; margin-bottom: 25px;">
  <img src="https://cdc.cleit.in/upasthiti.png" 
       alt="Upasthiti" 
       style="width: 180px; height: auto;">
</div>
          
          <h1 style="color: #2d2d2d; text-align: center;">Welcome to Kavyansh!</h1>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; text-align: left;">
            We’re thrilled to have you join <strong>Kavyansh</strong> — a creative home for writers, poets, and storytellers.  
            To continue your journey and verify your email, please use the OTP below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background-color: #f0e7da; color: #8b4513; font-size: 26px; font-weight: bold; letter-spacing: 4px; padding: 14px 28px; border-radius: 8px;">
              ${otp}
            </span>
          </div>

          <p style="color: #555; font-size: 14px; text-align: left;">
            This OTP is valid for <strong>5 minutes</strong>.
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: left; margin-top: 25px;">
            If you didn’t request this verification, please ignore this email.
          </p>
          
          <p style="color: #2d2d2d; font-size: 14px; text-align: left; margin-top: 35px;">
            With creativity,<br>Team Kavyansh
          </p>

        </div>
      </div>
      `,
    });

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
