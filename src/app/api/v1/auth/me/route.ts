import { NextResponse } from "next/server";
import { withAuth, AuthRequest } from "@/lib/withAuth";

/**
 * @swagger
 * /v1/auth/me:
 *   get:
 *     summary: Get logged-in user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid or expired token
 */

const handler = async (req: AuthRequest) => {
        const user = req.user;
        return NextResponse.json({
                message: "User fetched successfully",
                user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        isActive: user.isActive,
                        emailVerified: user.emailVerified,
                },
        });
};

export const GET = withAuth(handler);