import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

export type AuthRequest = Request & {
        user: User;
};

export function withAuth(
        handler: (req: AuthRequest, ctx?: any) => Promise<Response>
) {
        return async (req: Request, ctx?: any): Promise<Response> => {
                try {
                        const cookieHeader = req.headers.get("cookie") || "";

                        const cookies = Object.fromEntries(
                                cookieHeader
                                        .split(";")
                                        .map((c) => c.trim().split("="))
                                        .filter((v) => v.length === 2)
                        );

                        const token = cookies["accessToken"];

                        if (!token) {
                                return NextResponse.json(
                                        { error: "Unauthorized - No token" },
                                        { status: 401 }
                                );
                        }

                        const decoded = jwt.verify(
                                token,
                                process.env.ACCESS_TOKEN_SECRET as string
                        ) as { id: string };

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

                        return handler(req as AuthRequest, ctx);
                } catch {
                        return NextResponse.json(
                                { error: "Invalid or expired token" },
                                { status: 403 }
                        );
                }
        };
}