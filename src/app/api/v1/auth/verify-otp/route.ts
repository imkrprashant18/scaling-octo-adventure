import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendVerificationSuccess } from "@/lib/mail";

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
                const { email, otp } = await req.json();

                if (!email || !otp) {
                        return NextResponse.json(
                                { error: "Email and OTP are required" },
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

                if (user.otp !== otp) {
                        return NextResponse.json(
                                { error: "Invalid OTP" },
                                { status: 400 }
                        );
                }

                if (!user.otpExpiry || new Date() > user.otpExpiry) {
                        return NextResponse.json(
                                { error: "OTP expired. Please request a new one." },
                                { status: 400 }
                        );
                }

                await prisma.user.update({
                        where: { email },
                        data: {
                                emailVerified: true,
                                isActive: true,
                                otp: null,
                                otpExpiry: null,
                        },
                });

                await sendVerificationSuccess(email);
                return NextResponse.json({
                        message: "Email verified successfully and account activated",
                });

        } catch (error) {
                return NextResponse.json(
                        { error: "OTP verification failed" },
                        { status: 500 }
                );
        }
}