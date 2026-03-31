import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateAccessToken } from "@/lib/generateToken";
import { cookies } from "next/headers";

/**
 * @swagger
 * /v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Access token refreshed
 *       401:
 *         description: No refresh token or unauthorized
 *       403:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Refresh failed
 */

export async function POST() {
        try {
                const cookieStore = await cookies();
                const refreshToken = cookieStore.get("refreshToken")?.value;

                if (!refreshToken) {
                        return NextResponse.json(
                                { error: "No refresh token" },
                                { status: 401 }
                        );
                }

                let decoded: any;
                try {
                        decoded = jwt.verify(
                                refreshToken,
                                process.env.REFRESH_TOKEN_SECRET!
                        );
                } catch (err) {
                        return NextResponse.json(
                                { error: "Invalid or expired refresh token" },
                                { status: 403 }
                        );
                }

                const user = await prisma.user.findUnique({
                        where: { id: decoded.id },
                });

                if (!user || !user.refreshToken) {
                        return NextResponse.json(
                                { error: "Unauthorized" },
                                { status: 401 }
                        );
                }

                const isValid = await bcrypt.compare(
                        refreshToken,
                        user.refreshToken
                );

                if (!isValid) {
                        return NextResponse.json(
                                { error: "Invalid refresh token" },
                                { status: 403 }
                        );
                }

                const newAccessToken = generateAccessToken(user);

                cookieStore.set("accessToken", newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "strict",
                        maxAge: 60 * 15,
                        path: "/",
                });

                return NextResponse.json({
                        message: "Access token refreshed",
                        accessToken: newAccessToken,
                        user: {
                                id: user.id,
                                email: user.email,
                                role: user.role,
                        },
                });

        } catch (error) {
                return NextResponse.json(
                        { error: "Refresh failed" },
                        { status: 500 }
                );
        }
}