import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendOTP } from "@/lib/mail";
import { generateOTP } from "@/lib/generateOtp";


import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";

/**
 * @swagger
 * /v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */

export const POST = asyncHandler(async (req: Request) => {
        const { name, email, password } = await req.json();
        if (!name || !email || !password) {
                throw new ApiError(400, "All fields are required");
        }
        const existing = await prisma.user.findUnique({
                where: { email },
        });
        if (existing) {
                throw new ApiError(400, "User already exists");
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
        return Response.json(
                new ApiResponse(
                        201,
                        {
                                userId: user.id,
                                expiresIn: otpExpiry.toISOString(),
                        },
                        "Register successful, OTP sent to email"
                )
        );
});