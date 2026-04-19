import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";
import { prisma } from "@/lib/prisma";
import { AuthRequest, withAuth } from "@/lib/withAuth";
import { withRole } from "@/lib/withRole";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/patients/payments
 * Initiate Khalti payment for an appointment
 */
const initiatePayment = asyncHandler(
        withRole([UserRole.PATIENT], async (req: AuthRequest) => {
                const patientId = req.user.id;
                const { appointmentId } = await req.json();

                if (!appointmentId) {
                        throw new ApiError(400, "Appointment ID is required");
                }

                // Fetch appointment with payment details
                const appointment = await prisma.appointment.findUnique({
                        where: { id: appointmentId },
                        include: {
                                payment: true,
                                doctor: true,
                                patient: true,
                        },
                });

                if (!appointment) {
                        throw new ApiError(404, "Appointment not found");
                }

                // Verify patient owns this appointment
                if (appointment.patientId !== patientId) {
                        throw new ApiError(403, "Unauthorized to access this appointment");
                }

                // Check if payment already exists
                if (!appointment.payment) {
                        throw new ApiError(400, "No payment record found for this appointment");
                }

                // Check if already completed
                if (appointment.payment.status === "COMPLETED") {
                        throw new ApiError(400, "Payment already completed");
                }

                // Prepare Khalti payload
                const khaltiPayload = {
                        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/appointments/${appointmentId}/payment-success`,
                        website_url: process.env.NEXT_PUBLIC_APP_URL,
                        amount: appointment.payment.amount * 100, // Khalti expects amount in paisa
                        merchant_name: "MediCare Plus",
                        description: `Appointment with Dr. ${appointment.doctor.name}`,
                        customer_info: {
                                name: appointment.patient.name,
                                email: appointment.patient.email,
                                phone: appointment.patient.phone,
                        },
                        amount_breakdown: [
                                {
                                        label: `Consultation Fee - Dr. ${appointment.doctor.name}`,
                                        amount: appointment.payment.amount * 100,
                                },
                        ],
                        product_details: [
                                {
                                        identity: "appointment",
                                        name: `Medical Appointment - ${new Date(appointment.startTime).toLocaleDateString()}`,
                                        total_price: appointment.payment.amount * 100,
                                        quantity: 1,
                                        unit_price: appointment.payment.amount * 100,
                                },
                        ],
                        // Custom metadata to store in Khalti
                        meta: {
                                appointment_id: appointmentId,
                                patient_id: patientId,
                                doctor_id: appointment.doctorId,
                        },
                };

                // Initialize payment with Khalti
                const khaltiResponse = await fetch("https://a.khalti.com/api/v2/epayment/initiate/", {
                        method: "POST",
                        headers: {
                                Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                                "Content-Type": "application/json",
                        },
                        body: JSON.stringify(khaltiPayload),
                });

                if (!khaltiResponse.ok) {
                        const error = await khaltiResponse.json();
                        console.error("Khalti initiation error:", error);
                        throw new ApiError(500, "Failed to initiate payment with Khalti");
                }

                const khaltiData = await khaltiResponse.json();

                // Update payment with pidx from Khalti
                await prisma.payment.update({
                        where: { id: appointment.payment.id },
                        data: {
                                pidx: khaltiData.pidx,
                        },
                });

                return NextResponse.json(
                        new ApiResponse(
                                200,
                                {
                                        pidx: khaltiData.pidx,
                                        paymentUrl: khaltiData.payment_url,
                                        appointmentId,
                                },
                                "Payment initiated successfully. Redirect to payment_url to complete payment."
                        )
                );
        })
);

export const POST = withAuth(initiatePayment);
