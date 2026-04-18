import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { asyncHandler } from "@/lib/AsyncHandler";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { UserRole } from "@prisma/client";

const handler = asyncHandler<AuthRequest>(async (req, ctx) => {
        const user = req.user;
        if (user.role !== UserRole.ADMIN) {
                throw new ApiError(403, "Only admin can access this resource");
        }
        const params = await ctx?.params;
        const id = params?.id;
        if (!id) {
                throw new ApiError(400, "Doctor id is required");
        }

        const Patients = await prisma.user.findUnique({
                where: {
                        id,
                        role: UserRole.PATIENT,
                },
                select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        gender: true,
                        dob: true,
                        address: true,
                        description: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                },
        });

        if (!Patients) {
                throw new ApiError(404, "patients not found");
        }

        return NextResponse.json(
                new ApiResponse(200, Patients, "Doctor fetched successfully")
        );
});

export const GET = withAuth(handler);