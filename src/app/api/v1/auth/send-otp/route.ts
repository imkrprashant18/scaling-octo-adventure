import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateOTP } from "@/lib/generateOtp";
import { sendOTP } from "@/lib/mail";

/**
 * @swagger
 * /v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP to activate account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: OTP verification failed
 */

export async function POST(req: Request) {
        try {
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
                        return NextResponse.json(
                                { error: "User not found" },
                                { status: 404 }
                        );
                }

                if (user.emailVerified) {
                        return NextResponse.json(
                                { error: "Email already verified" },
                                { status: 400 }
                        );
                }

                if (user.otpExpiry && new Date() < new Date(user.otpExpiry.getTime() - 4 * 60 * 1000)) {
                        return NextResponse.json(
                                { error: "Please wait before requesting another OTP" },
                                { status: 429 }
                        );
                }

                const newOtp = generateOTP();
                const newExpiry = new Date(Date.now() + 5 * 60 * 1000);
                await prisma.user.update({
                        where: { email },
                        data: {
                                otp: newOtp,
                                otpExpiry: newExpiry,
                        },
                });
                await sendOTP(email, newOtp);
                return NextResponse.json({
                        message: `OTP sent successfully to ${email}`,
                        otpExpiry: newExpiry,
                });

        } catch (error) {
                return NextResponse.json(
                        { error: "Failed to resend OTP" },
                        { status: 500 }
                );
        }
}