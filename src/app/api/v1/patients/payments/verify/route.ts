import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";
import { prisma } from "@/lib/prisma";
import { AuthRequest, withAuth } from "@/lib/withAuth";
import { withRole } from "@/lib/withRole";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/patients/payments/verify
 * Verify Khalti payment and update appointment status
 */
const verifyPayment = asyncHandler(
        withRole([UserRole.PATIENT], async (req: AuthRequest) => {
                const patientId = req.user.id;
                const { pidx } = await req.json();

                if (!pidx) {
                        throw new ApiError(400, "Payment index (pidx) is required");
                }

                // Find payment by pidx
                const payment = await prisma.payment.findUnique({
                        where: { pidx },
                        include: {
                                appointment: true,
                                user: true,
                        },
                });

                if (!payment) {
                        throw new ApiError(404, "Payment not found");
                }

                // Verify patient owns this payment
                if (payment.userId !== patientId) {
                        throw new ApiError(403, "Unauthorized to access this payment");
                }

                // Verify payment with Khalti
                const khaltiVerifyPayload = {
                        pidx: pidx,
                        transaction_id: null,
                        amount: payment.amount * 100, // Amount in paisa
                };

                const khaltiResponse = await fetch("https://a.khalti.com/api/v2/epayment/complete/", {
                        method: "POST",
                        headers: {
                                Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(khaltiVerifyPayload),
                });

                if (!khaltiResponse.ok) {
                        const error = await khaltiResponse.json();
                        console.error("Khalti verification error:", error);

                        // Update payment status to FAILED
                        await prisma.payment.update({
                                where: { id: payment.id },
                                data: {
                                        status: "FAILED",
                                },
                        });

                        throw new ApiError(400, error.detail || "Payment verification failed");
                }

                const khaltiData = await khaltiResponse.json();

                // Update payment with transaction details
                const updatedPayment = await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                                status: "COMPLETED",
                                transactionId: khaltiData.transaction_id,
                                khaltiUser: khaltiData.user?.phone || khaltiData.user?.mobile || null,
                        },
                });

                // Update appointment status to SCHEDULED (payment completed)
                const updatedAppointment = await prisma.appointment.update({
                        where: { id: payment.appointmentId },
                        data: {
                                status: "SCHEDULED",
                        },
                        include: {
                                doctor: true,
                                payment: true,
                        },
                });

                return NextResponse.json(
                        new ApiResponse(
                                200,
                                {
                                        payment: {
                                                id: updatedPayment.id,
                                                status: updatedPayment.status,
                                                transactionId: updatedPayment.transactionId,
                                                amount: updatedPayment.amount,
                                        },
                                        appointment: {
                                                id: updatedAppointment.id,
                                                status: updatedAppointment.status,
                                                doctorName: updatedAppointment.doctor.name,
                                                appointmentTime: updatedAppointment.startTime,
                                        },
                                },
                                "Payment verified and appointment confirmed"
                        )
                );
        })
);

export const POST = withAuth(verifyPayment);
