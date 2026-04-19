import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";
import { prisma } from "@/lib/prisma";
import { AuthRequest, withAuth } from "@/lib/withAuth";
import { withRole } from "@/lib/withRole";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/patients/payments/[paymentId]
 * Get payment status for a specific payment
 */
const getPaymentStatus = asyncHandler(
        withRole([UserRole.PATIENT], async (req: AuthRequest, ctx: any) => {
                const patientId = req.user.id;
                const params = await ctx?.params;
                const paymentId = params?.paymentId;

                if (!paymentId) {
                        throw new ApiError(400, "Payment ID is required");
                }

                const payment = await prisma.payment.findUnique({
                        where: { id: paymentId },
                        include: {
                                appointment: {
                                        include: {
                                                doctor: {
                                                        select: {
                                                                id: true,
                                                                name: true,
                                                                specialty: true,
                                                        },
                                                },
                                        },
                                },
                        },
                });

                if (!payment) {
                        throw new ApiError(404, "Payment not found");
                }

                // Verify patient owns this payment
                if (payment.userId !== patientId) {
                        throw new ApiError(403, "Unauthorized to access this payment");
                }

                return NextResponse.json(
                        new ApiResponse(
                                200,
                                {
                                        payment: {
                                                id: payment.id,
                                                amount: payment.amount,
                                                status: payment.status,
                                                pidx: payment.pidx,
                                                transactionId: payment.transactionId,
                                                createdAt: payment.createdAt.toISOString(),
                                                updatedAt: payment.updatedAt.toISOString(),
                                        },
                                        appointment: {
                                                id: payment.appointment.id,
                                                status: payment.appointment.status,
                                                doctorName: payment.appointment.doctor.name,
                                                specialty: payment.appointment.doctor.specialty,
                                                startTime: payment.appointment.startTime.toISOString(),
                                                endTime: payment.appointment.endTime.toISOString(),
                                        },
                                },
                                "Payment status retrieved successfully"
                        )
                );
        })
);

export const GET = withAuth(getPaymentStatus);
