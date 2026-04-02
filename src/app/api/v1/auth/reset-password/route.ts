import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";


import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";

/**
 * @swagger
 * /v1/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 */

export const POST = asyncHandler(async (req: Request) => {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
                throw new ApiError(400, "All fields are required");
        }

        const user = await prisma.user.findUnique({
                where: { email },
        });

        if (!user) {
                throw new ApiError(400, "Invalid request");
        }

        if (user.otp !== otp) {
                throw new ApiError(400, "Invalid OTP");
        }

        if (!user.otpExpiry || new Date() > user.otpExpiry) {
                throw new ApiError(400, "OTP expired. Please request again");
        }
        if (user.otpAttempts >= 5) {
                throw new ApiError(429, "Too many attempts. Try later.");
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
                where: { email },
                data: {
                        password: hashedPassword,
                        otp: null,
                        otpExpiry: null,
                        otpAttempts: 0
                },
        });

        return Response.json(
                new ApiResponse(200, null, "Password reset successful")
        );
});