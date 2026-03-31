import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

/**
 * @swagger
 * /v1/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP or expired
 *       500:
 *         description: Reset failed
 */

export async function POST(req: Request) {
        try {
                const { email, otp, newPassword } = await req.json();

                if (!email || !otp || !newPassword) {
                        return NextResponse.json(
                                { error: "All fields are required" },
                                { status: 400 }
                        );
                }

                const user = await prisma.user.findUnique({
                        where: { email },
                });

                if (!user) {
                        return NextResponse.json(
                                { error: "Invalid request" },
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
                                { error: "OTP expired. Please request again." },
                                { status: 400 }
                        );
                }

                const hashedPassword = await bcrypt.hash(newPassword, 10);

                await prisma.user.update({
                        where: { email },
                        data: {
                                password: hashedPassword,
                                otp: null,
                                otpExpiry: null,
                        },
                });

                return NextResponse.json({
                        message: "Password reset successful ",
                });

        } catch (error) {
                return NextResponse.json(
                        { error: "Reset failed" },
                        { status: 500 }
                );
        }
}