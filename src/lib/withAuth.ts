import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

export type AuthRequest = Request & { user: User };

export function withAuth(handler: (req: AuthRequest, user: User) => Promise<Response>) {
        return async (req: Request) => {
                try {
                        const cookieHeader = req.headers.get("cookie") || "";

                        const cookies = Object.fromEntries(
                                cookieHeader.split("; ").map((c) => c.split("="))
                        );

                        const token = cookies["accessToken"];

                        if (!token) {
                                return NextResponse.json(
                                        { error: "Unauthorized - No token" },
                                        { status: 401 }
                                );
                        }

                        const decoded: any = jwt.verify(
                                token,
                                process.env.ACCESS_TOKEN_SECRET!
                        );

                        const user = await prisma.user.findUnique({
                                where: { id: decoded.id },
                        });

                        if (!user) {
                                return NextResponse.json(
                                        { error: "Unauthorized - User not found" },
                                        { status: 401 }
                                );
                        }

                        (req as AuthRequest).user = user;

                        return handler(req as AuthRequest, user);
                } catch (err) {
                        return NextResponse.json(
                                { error: "Invalid or expired token" },
                                { status: 403 }
                        );
                }
        };
}