/**
 * Khalti Payment Integration Utilities
 * Shared functions for Khalti payment operations
 */

import { prisma } from "./prisma";

/**
 * Verify Khalti payment with Khalti servers
 */
export async function verifyKhaltiPayment(
        pidx: string,
        amount: number
): Promise<{
        status: string;
        transaction_id: string;
        user?: { phone: string; mobile: string };
}> {
        const response = await fetch("https://a.khalti.com/api/v2/epayment/complete/", {
                method: "POST",
                headers: {
                        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                        "Content-Type": "application/json",
                },
                body: JSON.stringify({
                        pidx,
                        transaction_id: null,
                        amount: amount * 100, // Convert to paisa
                }),
        });

        if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Khalti verification failed");
        }

        return await response.json();
}

/**
 * Initiate payment with Khalti
 */
export async function initiateKhaltiPayment(payload: {
        return_url: string;
        website_url: string;
        amount: number; // in rupees
        merchant_name: string;
        description: string;
        customer_info: {
                name: string;
                email: string;
                phone?: string;
        };
        amount_breakdown: Array<{ label: string; amount: number }>;
        product_details: Array<{
                identity: string;
                name: string;
                total_price: number;
                quantity: number;
                unit_price: number;
        }>;
        meta?: any;
}): Promise<{ pidx: string; payment_url: string }> {
        const response = await fetch("https://a.khalti.com/api/v2/epayment/initiate/", {
                method: "POST",
                headers: {
                        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                        "Content-Type": "application/json",
                },
                body: JSON.stringify({
                        ...payload,
                        amount: payload.amount * 100, // Convert to paisa
                        amount_breakdown: payload.amount_breakdown.map((item) => ({
                                ...item,
                                amount: item.amount * 100,
                        })),
                        product_details: payload.product_details.map((item) => ({
                                ...item,
                                total_price: item.total_price * 100,
                                unit_price: item.unit_price * 100,
                        })),
                }),
        });

        if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Failed to initiate Khalti payment");
        }

        return await response.json();
}

/**
 * Update payment record after successful verification
 */
export async function updatePaymentAfterVerification(
        paymentId: string,
        transactionId: string,
        khaltiUser?: string
) {
        return await prisma.payment.update({
                where: { id: paymentId },
                data: {
                        status: "COMPLETED",
                        transactionId,
                        khaltiUser: khaltiUser || null,
                        updatedAt: new Date(),
                },
        });
}

/**
 * Handle payment failure
 */
export async function markPaymentFailed(paymentId: string, reason?: string) {
        return await prisma.payment.update({
                where: { id: paymentId },
                data: {
                        status: "FAILED",
                        updatedAt: new Date(),
                },
        });
}

/**
 * Get payment summary for dashboard
 */
export async function getPaymentSummary(userId: string) {
        const payments = await prisma.payment.groupBy({
                by: ["status"],
                where: {
                        userId,
                },
                _sum: {
                        amount: true,
                },
                _count: true,
        });

        return payments.reduce(
                (acc, item) => {
                        acc[item.status] = {
                                count: item._count,
                                total: (item._sum.amount || 0) / 100, // Convert to rupees
                        };
                        return acc;
                },
                {} as Record<
                        string,
                        {
                                count: number;
                                total: number;
                        }
                >
        );
}

/**
 * Validate Khalti webhook signature
 */
export function validateKhaltiSignature(
        signature: string,
        payload: string
): boolean {
        const crypto = require("crypto");
        const expectedSignature = crypto
                .createHmac("sha256", process.env.KHALTI_SECRET_KEY || "")
                .update(payload)
                .digest("hex");

        return signature === expectedSignature;
}

/**
 * Format amount for display
 */
export function formatAmount(amountInPaisa: number): string {
        const rupees = amountInPaisa / 100;
        return `Rs. ${rupees.toLocaleString("ne-NP", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
        })}`;
}

/**
 * Get payment status display text
 */
export function getPaymentStatusDisplay(status: string): string {
        const statusMap: Record<string, string> = {
                PENDING: "Awaiting Payment",
                COMPLETED: "Paid",
                FAILED: "Payment Failed",
                REFUNDED: "Refunded",
        };
        return statusMap[status] || status;
}
