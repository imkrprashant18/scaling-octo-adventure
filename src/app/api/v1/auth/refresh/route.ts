import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { generateAccessToken } from "@/lib/generateToken";
import { asyncHandler } from "@/lib/AsyncHandler";

/**
 * @swagger
 * /v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 */

export const POST = asyncHandler(async () => {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refreshToken")?.value;

        if (!refreshToken) {
                throw new ApiError(401, "No refresh token");
        }

        let decoded: any;

        try {
                decoded = jwt.verify(
                        refreshToken,
                        process.env.REFRESH_TOKEN_SECRET as string
                );
        } catch {
                throw new ApiError(403, "Invalid or expired refresh token");
        }

        const user = await prisma.user.findUnique({
                where: { id: decoded.id },
        });

        if (!user || !user.refreshToken) {
                throw new ApiError(401, "Unauthorized");
        }

        const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

        if (!isValid) {
                throw new ApiError(403, "Invalid refresh token");
        }

        const newAccessToken = generateAccessToken(user);

        cookieStore.set("accessToken", newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 15,
                path: "/",
        });

        return Response.json(
                new ApiResponse(
                        200,
                        {
                                accessToken: newAccessToken,
                                user: {
                                        id: user.id,
                                        email: user.email,
                                        role: user.role,
                                },
                        },
                        "Access token refreshed"
                )
        );
});