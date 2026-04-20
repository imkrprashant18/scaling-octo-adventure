import { Resend } from "resend";
import { ApiError } from "@/lib/ApiError";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTP(email: string, otp: string) {
        try {
                await resend.emails.send({
                        from: process.env.EMAIL_FROM!,
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
                throw new ApiError(500, "Failed to send OTP email");
        }
}

export async function sendVerificationSuccess(email: string) {
        try {
                await resend.emails.send({
                        from: process.env.EMAIL_FROM!,
                        to: email,
                        subject: "Email Verified Successfully",
                        html: `
        <h2>✅ Email Verified</h2>
        <p>Your account has been successfully verified.</p>
        <p>You can now login.</p>
      `,
                });
        } catch (error) {
                console.log("Verification email error:", error);
        }
}


// 
export async function sendAppoimentSuccess(email: string, name: string) {
        try {
                await resend.emails.send({
                        from: process.env.EMAIL_FROM!,
                        to: email,
                        subject: "Appointment Booked Successfully",
                        html: `
        <h2>✅ Appointment Booked</h2>
        <p>Dear ${name}, your appointment has been successfully booked.</p>
      `,

                });
        } catch (error) {
                console.log("Appointment email error:", error);
        }
}