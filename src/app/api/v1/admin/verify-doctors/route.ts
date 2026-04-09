import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";

const handler = asyncHandler<AuthRequest>(async (req) => {
        const admin = req.user;

        if (admin.role !== UserRole.ADMIN) {
                throw new ApiError(403, "Only admin can verify doctors");
        }

        const body = await req.json();
        const { userId, status } = body;

        if (!userId) {
                throw new ApiError(400, "User ID is required");
        }

        if (!status) {
                throw new ApiError(400, "Verification status is required");
        }

        const allowedStatus = ["PENDING",
                "VERIFIED",
                "REJECTED"];
        if (!allowedStatus.includes(status)) {
                throw new ApiError(400, "Invalid verification status");
        }

        const doctor = await prisma.user.findUnique({
                where: { id: userId },
        });

        if (!doctor) {
                throw new ApiError(404, "Doctor not found");
        }

        if (doctor.role !== UserRole.DOCTOR) {
                throw new ApiError(400, "User is not a doctor");
        }

        const updatedDoctor = await prisma.user.update({
                where: { id: userId },
                data: {
                        verificationStatus: status,
                },
        });

        return NextResponse.json(
                new ApiResponse(
                        200,
                        updatedDoctor,
                        `Doctor ${status.toLowerCase()} successfully`
                )
        );
});

export const PATCH = withAuth(handler);