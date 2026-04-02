import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/generateOtp";
import { sendOTP } from "@/lib/mail";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";

/**
 * @swagger
 * /v1/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to user email
 *     tags: [Auth]
 */

export const POST = asyncHandler(async (req: Request) => {
        const { email } = await req.json();
        if (!email) {
                throw new ApiError(400, "Email is required");
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
        if (
                user.otpExpiry &&
                new Date() <
                new Date(user.otpExpiry.getTime() - 4 * 60 * 1000)
        ) {
                throw new ApiError(
                        429,
                        "Please wait before requesting another OTP"
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

        return Response.json(
                new ApiResponse(
                        200,
                        {
                                email,
                                otpExpiry: newExpiry,
                        },
                        `OTP sent successfully to ${email}`
                )
        );
});