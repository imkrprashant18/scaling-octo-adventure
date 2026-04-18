import { addDays, addMinutes, format, isBefore, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { asyncHandler } from "@/lib/AsyncHandler";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

type Slot = {
        startTime: string;
        endTime: string;
        formatted: string;
        day: string;
};

const handler = asyncHandler<AuthRequest>(async (req, ctx) => {
        const user = req.user;

        if (user.role !== UserRole.PATIENT) {
                throw new ApiError(403, "Only Patients can access this resource");
        }

        const params = await ctx?.params;
        const doctorId = params?.id;

        if (!doctorId) {
                throw new ApiError(400, "Doctor id is required");
        }

        const doctor = await prisma.user.findUnique({
                where: {
                        id: doctorId,
                        role: UserRole.DOCTOR,
                        verificationStatus: "VERIFIED",
                        isActive: true,
                },
        });

        if (!doctor) {
                throw new ApiError(404, "Doctor not found or not verified");
        }

        const availability = await prisma.availability.findFirst({
                where: {
                        doctorId: doctor.id,
                        status: "AVAILABLE",
                },
        });

        if (!availability) {
                throw new ApiError(404, "No availability set by doctor");
        }


        const now = new Date();
        const days = [
                now,
                addDays(now, 1),
                addDays(now, 2),
                addDays(now, 3),
        ];

        const lastDay = endOfDay(days[3]);


        const existingAppointments = await prisma.appointment.findMany({
                where: {
                        doctorId: doctor.id,
                        status: "SCHEDULED",
                        startTime: {
                                lte: lastDay,
                        },
                },
        });


        const availableSlotsByDay: Record<string, Slot[]> = {};

        for (const day of days) {
                const dayString = format(day, "yyyy-MM-dd");
                availableSlotsByDay[dayString] = [];

                const availabilityStart = new Date(availability.startTime);
                const availabilityEnd = new Date(availability.endTime);

                availabilityStart.setFullYear(
                        day.getFullYear(),
                        day.getMonth(),
                        day.getDate()
                );

                availabilityEnd.setFullYear(
                        day.getFullYear(),
                        day.getMonth(),
                        day.getDate()
                );

                let current = new Date(availabilityStart);
                const end = new Date(availabilityEnd);

                while (
                        isBefore(addMinutes(current, 30), end) ||
                        +addMinutes(current, 30) === +end
                ) {
                        const next = addMinutes(current, 30);

                        if (isBefore(current, now)) {
                                current = next;
                                continue;
                        }

                        const overlaps = existingAppointments.some((appointment) => {
                                const aStart = new Date(appointment.startTime);
                                const aEnd = new Date(appointment.endTime);

                                return (
                                        (current >= aStart && current < aEnd) ||
                                        (next > aStart && next <= aEnd) ||
                                        (current <= aStart && next >= aEnd)
                                );
                        });

                        if (!overlaps) {
                                availableSlotsByDay[dayString].push({
                                        startTime: current.toISOString(),
                                        endTime: next.toISOString(),
                                        formatted: `${format(current, "h:mm a")} - ${format(next, "h:mm a")}`,
                                        day: format(current, "EEEE, MMMM d"),
                                });
                        }

                        current = next;
                }
        }

        const result = Object.entries(availableSlotsByDay).map(([date, slots]) => ({
                date,
                displayDate:
                        slots.length > 0
                                ? slots[0].day
                                : format(new Date(date), "EEEE, MMMM d"),
                slots,
        }));

        return NextResponse.json(
                new ApiResponse(200, { days: result }, "Available slots fetched successfully")
        );
});

export const GET = withAuth(handler);