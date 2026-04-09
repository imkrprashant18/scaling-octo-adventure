import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { ApiResponse } from "@/lib/ApiResponse";

import { ApiError } from "@/lib/ApiError";
import { asyncHandler } from "@/lib/AsyncHandler";

/**
 * @swagger
 * /v1/auth/me:
 *   get:
 *     summary: Get logged-in user
 *     tags: [Auth]
 */

const handler = asyncHandler<AuthRequest>(async (req) => {
        const user = req.user;

        if (!user) {
                throw new ApiError(401, "Unauthorized");
        }
        return NextResponse.json(
                new ApiResponse(
                        200,
                        {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role,
                                isActive: user.isActive,
                                emailVerified: user.emailVerified,
                                specialty: user.specialty,
                                experience: user.experience,
                                description: user.description,
                                opdFee: user.opdFee,
                                credentialUrl: user.credentialUrl,
                                avatar: user.avatar,
                                phone: user.phone,
                                address: user.address,
                                verificationStatus: user.verificationStatus,
                                createdAt: user.createdAt,
                                updatedAt: user.updatedAt,
                        },
                        "User fetched successfully"
                )
        );
});

export const GET = withAuth(handler);