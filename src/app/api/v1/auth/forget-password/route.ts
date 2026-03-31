import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateOTP } from "@/lib/generateOtp";
import { sendOTP } from "@/lib/mail";

/**
 * @swagger
 * /v1/auth/forget-password:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent if email exists
 *       500:
 *         description: Failed to send OTP
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
                        },
                });

                await sendOTP(email, otp);

                return NextResponse.json({
                        message: "OTP sent successfully",
                        expiresIn: otpExpiry,
                });

        } catch (error) {
                return NextResponse.json(
                        { error: "Failed to send OTP" },
                        { status: 500 }
                );
        }
}