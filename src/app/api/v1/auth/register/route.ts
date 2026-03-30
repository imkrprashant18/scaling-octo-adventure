

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { sendOTP } from "@/lib/mail";
import { generateOTP } from "@/lib/generateOtp";


export async function POST(req: Request) {
        try {
                const { name, email, password } = await req.json();

                const existing = await prisma.user.findUnique({
                        where: { email },
                });

                if (existing) {
                        return NextResponse.json(
                                { error: "User already exists" },
                                { status: 400 }
                        );
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                const otp = generateOTP();
                const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

                const user = await prisma.user.create({
                        data: {
                                name,
                                email,
                                password: hashedPassword,
                                otp,
                                otpExpiry,
                                isActive: false,
                                emailVerified: false,
                        },
                });
                await sendOTP(email, otp);
                return NextResponse.json({
                        message: "Register Successful, OTP sent to email",
                        userId: user.id,
                });
        } catch (err) {
                return NextResponse.json(
                        { error: "Registration failed" },
                        { status: 500 }
                );
        }
}