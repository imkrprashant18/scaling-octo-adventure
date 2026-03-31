import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import {
        generateAccessToken,
        generateRefreshToken,
} from "@/lib/generateToken";
import { cookies } from "next/headers";

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified or account inactive
 *       500:
 *         description: Login failed
 */

export async function POST(req: Request) {
        try {
                const { email, password } = await req.json();

                if (!email || !password) {
                        return NextResponse.json(
                                { error: "Email and password are required" },
                                { status: 400 }
                        );
                }

                const user = await prisma.user.findUnique({
                        where: { email },
                });

                if (!user) {
                        return NextResponse.json(
                                { error: "Invalid credentials" },
                                { status: 401 }
                        );
                }

                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                        return NextResponse.json(
                                { error: "Invalid credentials" },
                                { status: 401 }
                        );
                }

                if (!user.emailVerified) {
                        return NextResponse.json(
                                {
                                        error: "Please verify your email first",
                                        emailVerified: false,
                                },
                                { status: 403 }
                        );
                }
                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);

                const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
                await prisma.user.update({
                        where: { id: user.id },
                        data: { refreshToken: hashedRefreshToken },
                });

                const cookieStore = await cookies();

                cookieStore.set("accessToken", accessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "strict",
                        maxAge: 60 * 15,
                        path: "/",
                });

                cookieStore.set("refreshToken", refreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "strict",
                        maxAge: 60 * 60 * 24 * 7,
                        path: "/",
                });

                return NextResponse.json({
                        message: "Login successful ",
                        accessToken,
                        refreshToken,
                        user: {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role,
                        },
                });

        } catch (error) {
                return NextResponse.json(
                        { error: "Login failed" },
                        { status: 500 }
                );
        }
}