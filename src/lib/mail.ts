// /lib/mail.ts

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTP(email: string, otp: string) {
        try {
                await resend.emails.send({
                        from: "Salon App <onboarding@resend.dev>", // default domain (or your verified domain)
                        to: email,
                        subject: "Your OTP Code",
                        html: `
        <div style="font-family:Arial, sans-serif; padding:20px">
          <h2>Salon App Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing:4px; font-size:32px">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
                });
        } catch (error) {
                console.error("Resend OTP error:", error);
                throw new Error("Failed to send OTP email");
        }
}