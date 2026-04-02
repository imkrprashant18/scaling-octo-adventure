import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { withAuth, AuthRequest } from "@/lib/withAuth";

const handler = async (req: AuthRequest) => {
        try {
                const body = await req.json();
                const { userId } = body;
                if (!userId) {
                        return NextResponse.json(
                                { error: "User ID is required" },
                                { status: 400 }
                        );
                }


                const user = await prisma.user.findUnique({
                        where: { id: userId },
                });

                if (!user) {
                        return NextResponse.json(
                                { error: "User not found" },
                                { status: 404 }
                        );
                }

                if (user.role !== UserRole.UNASSIGNED) {
                        return NextResponse.json(
                                { error: "User role already assigned" },
                                { status: 400 }
                        );
                }

                const updatedUser = await prisma.user.update({
                        where: { id: userId },
                        data: {
                                role: UserRole.PATIENT,
                                isActive: true,
                                verificationStatus: "VERIFIED",
                        },
                });

                return NextResponse.json({
                        message: "User role updated to PATIENT",
                        user: updatedUser,
                });
        } catch (error) {
                return NextResponse.json(
                        { error: "Something went wrong" },
                        { status: 500 }
                );
        }
};

export const PATCH = withAuth(handler);