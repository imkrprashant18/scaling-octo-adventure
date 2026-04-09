import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/lib/AsyncHandler";
import { AuthRequest, withAuth } from "@/lib/withAuth";
import { withRole } from "@/lib/withRole";
import { UserRole } from "@prisma/client";
import { createAvailabilitySchema } from "@/lib/validationSchema";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";

export const handler = asyncHandler(
        withRole([UserRole.DOCTOR], async (req: AuthRequest) => {
                const body = await req.json();
                const parsed = createAvailabilitySchema.safeParse(body);
                if (!parsed.success) {
                        throw new ApiError(
                                400,
                                "Invalid input",
                                [parsed.error.flatten()]
                        );
                }
                const { startTime, endTime } = parsed.data;
                const doctorId = req.user.id;
                const start = new Date(startTime);
                const end = new Date(endTime);
                if (start >= end) {
                        throw new ApiError(400, "startTime must be before endTime");
                }

                const overlap = await prisma.availability.findFirst({
                        where: {
                                doctorId,
                                OR: [
                                        {
                                                startTime: { lte: end },
                                                endTime: { gte: start },
                                        },
                                ],
                        },
                });

                if (overlap) {
                        throw new ApiError(
                                409,
                                "Overlapping availability exists"
                        );
                }

                const availability = await prisma.availability.create({
                        data: {
                                doctorId,
                                startTime: start,
                                endTime: end,
                        },
                });

                return NextResponse.json(
                        new ApiResponse(201, availability, "Availability created successfully"),
                        { status: 201 }
                );
        })
);



export const POST = withAuth(handler);