import { prisma } from "@/lib/prisma";
import { sendVerificationSuccess } from "@/lib/mail";

import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";

/**
 * @swagger
 * /v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP to activate account
 *     tags: [Auth]
 */

export const POST = asyncHandler(async (req: Request) => {
        const { email, otp } = await req.json();
        if (!email || !otp) {
                throw new ApiError(400, "Email and OTP are required");
        }
        const user = await prisma.user.findUnique({
                where: { email },
        });

        if (!user) {
                throw new ApiError(404, "User not found");
        }
        if (user.emailVerified) {
                throw new ApiError(400, "Email already verified");
        }
        if (user.otp !== otp) {
                throw new ApiError(400, "Invalid OTP");
        }
        if (!user.otpExpiry || new Date() > user.otpExpiry) {
                throw new ApiError(400, "OTP expired. Please request a new one");
        }

        await prisma.user.update({
                where: { email },
                data: {
                        emailVerified: true,
                        otp: null,
                        otpExpiry: null,
                        otpAttempts: 0,
                },
        });
        await sendVerificationSuccess(email);
        return Response.json(
                new ApiResponse(200, null, "Email verified successfully and account activated")
        );
});