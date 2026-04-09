import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";

const handler = asyncHandler<AuthRequest>(async (req) => {
        const body = await req.json();
        const { userId, phone, address } = body;

        if ((!phone && !address) || !userId) {
                throw new ApiError(400, "User ID is required");
        }

        const user = await prisma.user.findUnique({
                where: { id: userId },
        });

        if (!user) {
                throw new ApiError(404, "User not found");
        }

        if (user.role !== UserRole.UNASSIGNED) {
                throw new ApiError(400, "User role already assigned");
        }
        const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                        role: UserRole.PATIENT,
                        isActive: true,
                        verificationStatus: "VERIFIED",
                },
        });
        return NextResponse.json(
                new ApiResponse(200, updatedUser, "User role updated to PATIENT")
        );
});

export const PATCH = withAuth(handler);