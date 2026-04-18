import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";
import { prisma } from "@/lib/prisma";
import { AuthRequest, withAuth } from "@/lib/withAuth";
import { withRole } from "@/lib/withRole";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";




const handler = asyncHandler(withRole([UserRole.PATIENT], async (req: AuthRequest) => {
        const patientId = req.user.id;
        if (!patientId) {
                throw new ApiError(400, "Patient  is required");
        }

        const { doctorId, startTime, endTime, patientDescription, amount } = await req.json();
        if (!doctorId || !startTime || !endTime) {
                throw new ApiError(400, "Doctor ID, start time, and end time are required");
        }

        // Validate time slot
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
                throw new ApiError(400, "Start time must be before end time");
        }

        if (start < new Date()) {
                throw new ApiError(400, "Cannot book appointment in the past");
        }

        const doctor = await prisma.user.findFirst({
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

        // Check for overlapping appointments with the doctor (excluding cancelled ones)
        const overlappingAppointment = await prisma.appointment.findFirst({
                where: {
                        doctorId: doctorId,
                        status: {
                                in: ["SCHEDULED", "PAYMENT_PENDING", "COMPLETED"],
                        },
                        startTime: {
                                lt: endTime,
                        },
                        endTime: {
                                gt: startTime,
                        },
                },
        });
        if (overlappingAppointment) {
                throw new ApiError(409, "This time slot is already booked with the doctor. Please choose another time.");
        }

        // Check for duplicate bookings - patient cannot have multiple appointments at the same time
        const patientDuplicateBooking = await prisma.appointment.findFirst({
                where: {
                        patientId: patientId,
                        status: {
                                in: ["SCHEDULED", "PAYMENT_PENDING", "COMPLETED"],
                        },
                        startTime: {
                                lt: endTime,
                        },
                        endTime: {
                                gt: startTime,
                        },
                },
        });
        if (patientDuplicateBooking) {
                throw new ApiError(409, "You already have an appointment scheduled at this time.");
        }

        const appointment = await prisma.appointment.create({
                data: {
                        patientId: patientId,
                        doctorId: doctor.id,
                        startTime,
                        endTime,
                        patientDescription,
                        status: "PAYMENT_PENDING",
                        payment: amount ? {
                                create: {
                                        amount,
                                        status: "PENDING",
                                        pidx: `${patientId}-${doctor.id}-${Date.now()}`,
                                        userId: patientId,
                                },
                        } : undefined,
                },
                include: {
                        payment: true,
                },
        });

        return NextResponse.json(
                new ApiResponse(200, appointment, "Appointment booked successfully. Please proceed with payment.")
        );
}));

export const POST = withAuth(handler);