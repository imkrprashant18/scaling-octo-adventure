import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { asyncHandler } from "@/lib/AsyncHandler";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { UserRole } from "@prisma/client";

const handler = asyncHandler<AuthRequest>(async (req, ctx) => {
        const user = req.user;
        if (user.role !== UserRole.PATIENT) {
                throw new ApiError(403, "Only Patients can access this resource");
        }
        const params = await ctx?.params;
        const id = params?.id;
        if (!id) {
                throw new ApiError(400, "Doctor id is required");
        }

        const doctor = await prisma.user.findUnique({
                where: {
                        id,
                        role: UserRole.DOCTOR,
                        verificationStatus: "VERIFIED",
                        isActive: true,
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
                        specialty: true,
                        experience: true,
                        description: true,
                        opdFee: true,
                        credentialUrl: true,
                        verificationStatus: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                        availabilities: {
                                orderBy: {
                                        startTime: "asc",
                                },
                                select: {
                                        id: true,
                                        startTime: true,
                                        endTime: true,
                                },
                        }
                },
        });

        if (!doctor) {
                throw new ApiError(404, "Doctor not found");
        }

        return NextResponse.json(
                new ApiResponse(200, doctor, "Doctor fetched successfully")
        );
});

export const GET = withAuth(handler);