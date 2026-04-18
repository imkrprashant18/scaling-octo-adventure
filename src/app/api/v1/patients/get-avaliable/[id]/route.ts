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
        status: "available" | "booked";
        bookedBy?: string;
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

        // Optimized: Fetch doctor with availability in single query
        const doctor = await prisma.user.findUnique({
                where: {
                        id: doctorId,
                        role: UserRole.DOCTOR,
                        verificationStatus: "VERIFIED",
                        isActive: true,
                },
                include: {
                        availabilities: {
                                where: {
                                        status: "AVAILABLE",
                                },
                                take: 1,
                        },
                },
        });

        if (!doctor) {
                throw new ApiError(404, "Doctor not found or not verified");
        }

        if (!doctor.availabilities.length) {
                throw new ApiError(404, "No availability set by doctor");
        }

        const availability = doctor.availabilities[0];
        const now = new Date();
        const days = [now, addDays(now, 1), addDays(now, 2), addDays(now, 3)];
        const lastDay = endOfDay(days[3]);

        // Optimized: Fetch all appointments in one query with all relevant statuses
        const bookedAppointments = await prisma.appointment.findMany({
                where: {
                        doctorId: doctor.id,
                        status: {
                                in: ["SCHEDULED", "PAYMENT_PENDING", "COMPLETED"],
                        },
                        startTime: {
                                lte: lastDay,
                        },
                        endTime: {
                                gte: now,
                        },
                },
                select: {
                        startTime: true,
                        endTime: true,
                        patient: {
                                select: {
                                        id: true,
                                        name: true,
                                },
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

                        // Check if slot is booked
                        const bookedSlot = bookedAppointments.find((appointment) => {
                                const aStart = new Date(appointment.startTime);
                                const aEnd = new Date(appointment.endTime);

                                return (
                                        (current >= aStart && current < aEnd) ||
                                        (next > aStart && next <= aEnd) ||
                                        (current <= aStart && next >= aEnd)
                                );
                        });

                        const slot: Slot = {
                                startTime: current.toISOString(),
                                endTime: next.toISOString(),
                                formatted: `${format(current, "h:mm a")} - ${format(next, "h:mm a")}`,
                                day: format(current, "EEEE, MMMM d"),
                                status: bookedSlot ? "booked" : "available",
                                ...(bookedSlot && { bookedBy: bookedSlot.patient.name }),
                        };

                        availableSlotsByDay[dayString].push(slot);
                        current = next;
                }
        }

        // Calculate statistics
        const stats = Object.values(availableSlotsByDay).reduce(
                (acc, slots) => {
                        acc.totalSlots += slots.length;
                        acc.availableSlots += slots.filter((s) => s.status === "available").length;
                        acc.bookedSlots += slots.filter((s) => s.status === "booked").length;
                        return acc;
                },
                { totalSlots: 0, availableSlots: 0, bookedSlots: 0 }
        );

        const result = Object.entries(availableSlotsByDay).map(([date, slots]) => ({
                date,
                displayDate:
                        slots.length > 0
                                ? slots[0].day
                                : format(new Date(date), "EEEE, MMMM d"),
                totalSlots: slots.length,
                availableSlots: slots.filter((s) => s.status === "available").length,
                bookedSlots: slots.filter((s) => s.status === "booked").length,
                slots,
        }));

        return NextResponse.json(
                new ApiResponse(
                        200,
                        {
                                doctor: {
                                        id: doctor.id,
                                        name: doctor.name,
                                        specialty: doctor.specialty,
                                        opdFee: doctor.opdFee,
                                },
                                stats,
                                days: result,
                        },
                        "Slots fetched successfully"
                )
        );
});

export const GET = withAuth(handler);