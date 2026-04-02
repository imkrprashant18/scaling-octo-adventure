import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateOTP } from "@/lib/generateOtp";
import { sendOTP } from "@/lib/mail";
import { asyncHandler } from "@/lib/AsyncHandler";

export const POST = asyncHandler(async (req: Request) => {
        const { email } = await req.json();
        if (!email) {
                return NextResponse.json(
                        { error: "Email is required" },
                        { status: 400 }
                );
        }
        const user = await prisma.user.findUnique({
                where: { email },
        });

        if (!user) {
                return NextResponse.json({
                        message: "If email exists, OTP sent",
                });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.update({
                where: { email },
                data: {
                        otp,
                        otpExpiry,
                        otpAttempts: 0,
                },
        });

        await sendOTP(email, otp);

        return NextResponse.json({
                message: "OTP sent successfully",
                expiresIn: otpExpiry,
        });
});