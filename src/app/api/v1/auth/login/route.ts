import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import {
        generateAccessToken,
        generateRefreshToken,
} from "@/lib/generateToken";
import { asyncHandler } from "@/lib/AsyncHandler";


type LoginBody = {
        email: string;
        password: string;
};

export const POST = asyncHandler(async (req: Request) => {
        const body: LoginBody = await req.json();
        const { email, password } = body;

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
                message: "Login successful",
                user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                },
                accessToken, refreshToken,
        });
});