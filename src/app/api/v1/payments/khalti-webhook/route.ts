import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/v1/payments/khalti-webhook
 * Handle Khalti webhook notifications for payment completion
 * This is called by Khalti servers asynchronously
 */
export const POST = async (req: any) => {
        try {
                // Verify Khalti webhook signature
                const signature = req.headers.get("x-khalti-signature");
                if (!signature) {
                        return NextResponse.json(
                                { success: false, message: "Missing signature" },
                                { status: 400 }
                        );
                }

                const body = await req.json();
                const payload = JSON.stringify(body);

                // Verify signature
                const expectedSignature = crypto
                        .createHmac("sha256", process.env.KHALTI_SECRET_KEY || "")
                        .update(payload)
                        .digest("hex");

                if (signature !== expectedSignature) {
                        console.warn("Invalid Khalti webhook signature");
                        return NextResponse.json(
                                { success: false, message: "Invalid signature" },
                                { status: 401 }
                        );
                }

                const { pidx, transaction_id, status, user } = body;

                if (status !== "Completed") {
                        // Payment not completed, skip
                        return NextResponse.json({ success: true });
                }

                // Find payment by pidx
                const payment = await prisma.payment.findUnique({
                        where: { pidx },
                        include: { appointment: true },
                });

                if (!payment) {
                        console.warn(`Payment not found for pidx: ${pidx}`);
                        return NextResponse.json(
                                { success: false, message: "Payment not found" },
                                { status: 404 }
                        );
                }

                // Check if already completed
                if (payment.status === "COMPLETED") {
                        return NextResponse.json({ success: true });
                }

                // Update payment status
                await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                                status: "COMPLETED",
                                transactionId: transaction_id,
                                khaltiUser: user?.phone || user?.mobile || null,
                        },
                });

                // Update appointment status
                await prisma.appointment.update({
                        where: { id: payment.appointmentId },
                        data: {
                                status: "SCHEDULED",
                        },
                });

                console.log(`Payment verified via webhook: ${pidx}`);

                return NextResponse.json(
                        { success: true, message: "Payment processed successfully" },
                        { status: 200 }
                );
        } catch (error) {
                console.error("Khalti webhook error:", error);
                return NextResponse.json(
                        { success: false, message: "Internal server error" },
                        { status: 500 }
                );
        }
};
