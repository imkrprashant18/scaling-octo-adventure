import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/lib/AsyncHandler";
import { AuthRequest, withAuth } from "@/lib/withAuth";
import { withRole } from "@/lib/withRole";
import { UserRole } from "@prisma/client";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";

export const getHandler = asyncHandler(
        withRole([UserRole.DOCTOR], async (req: AuthRequest) => {
                const doctorId = req.user.id;

                if (!doctorId) {
                        throw new ApiError(400, "Doctor ID is required");
                }

                const availability = await prisma.availability.findMany({
                        where: {
                                doctorId,
                        },
                        orderBy: {
                                startTime: "asc",
                        },
                });

                return NextResponse.json(
                        new ApiResponse(
                                200,
                                availability,
                                "Doctor availability fetched successfully"
                        ),
                        { status: 200 }
                );
        })
);

export const GET = withAuth(getHandler);