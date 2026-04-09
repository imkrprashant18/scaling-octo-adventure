import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/lib/AsyncHandler";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";

export const GET = asyncHandler(async (req, ctx) => {
        const { id } = await (ctx?.params ?? Promise.resolve({ id: "" }));

        if (!id) {
                throw new ApiError(400, "Doctor id is required");
        }

        const doctor = await prisma.user.findUnique({
                where: { id },
                select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        specialty: true,
                        experience: true,
                        description: true,
                        opdFee: true,
                        credentialUrl: true,
                        verificationStatus: true,
                        isActive: true,
                        createdAt: true,
                },
        });

        if (!doctor) {
                throw new ApiError(404, "Doctor not found");
        }

        return NextResponse.json(
                new ApiResponse(200, doctor, "Doctor fetched successfully")
        );
});
