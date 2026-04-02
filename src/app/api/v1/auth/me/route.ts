import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { ApiResponse } from "@/lib/ApiResponse";

/**
 * @swagger
 * /v1/auth/me:
 *   get:
 *     summary: Get logged-in user
 *     tags: [Auth]
 */

const handler = async (req: AuthRequest) => {
        const user = req.user;

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
                        },
                        "User fetched successfully"
                )
        );
};

export const GET = withAuth(handler);