import { NextResponse } from "next/server";
import { AuthRequest } from "@/lib/withAuth";
import { UserRole } from "@prisma/client";

export const withRole = (roles: UserRole[], handler: Function) => {
        return async (req: AuthRequest) => {
                try {
                        const user = req.user;

                        if (!user) {
                                return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
                        }

                        if (!roles.includes(user.role)) {
                                return NextResponse.json(
                                        { message: "Forbidden: insufficient permissions" },
                                        { status: 403 }
                                );
                        }

                        return handler(req);
                } catch (err) {
                        return NextResponse.json(
                                { message: "Server error" },
                                { status: 500 }
                        );
                }
        };
};