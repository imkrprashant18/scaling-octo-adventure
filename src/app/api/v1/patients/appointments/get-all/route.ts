import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";
import { prisma } from "@/lib/prisma";
import { AuthRequest, withAuth } from "@/lib/withAuth";
import { withRole } from "@/lib/withRole";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { prismaCursorPagination } from "@/lib/prismaCursorPagination";

type AppointmentWithDetails = {
        id: string;
        doctor: {
                id: string;
                name: string;
                specialty: string | null;
                avatar: string | null;
                opdFee: number | null;
        };
        startTime: string;
        endTime: string;
        status: string;
        statusDisplay: string;
        formattedTime: string;
        formattedDate: string;
        patientDescription: string | null;
        notes: string | null;
        payment: {
                id: string;
                amount: number;
                status: string;
                pidx: string;
                transactionId: string | null;
        } | null;
        createdAt: string;
        updatedAt: string;
};

const handler = asyncHandler(withRole([UserRole.PATIENT], async (req: AuthRequest) => {
        const userId = req.user.id;
        if (!userId) {
                throw new ApiError(400, "User id is required");
        }

        const url = new URL(req.url);
        const status = url.searchParams.get("status");
        const sortBy = url.searchParams.get("sortBy") || "startTime";
        const order = (url.searchParams.get("order") || "desc") as "asc" | "desc";
        const cursor = url.searchParams.get("cursor") || undefined;
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);

        const user = await prisma.user.findUnique({
                where: {
                        id: userId,
                        role: UserRole.PATIENT,
                },
                select: {
                        id: true,
                },
        });

        if (!user) {
                throw new ApiError(404, "User not found");
        }

        const where: any = {
                patientId: user.id,
        };

        if (status) {
                where.status = status;
        }


        const result = await prismaCursorPagination({
                model: prisma.appointment,
                where,
                limit,
                cursor,
                cursorField: "id",
                orderBy: { [sortBy]: order },
                select: {
                        id: true,
                        startTime: true,
                        endTime: true,
                        status: true,
                        patientDescription: true,
                        notes: true,
                        createdAt: true,
                        updatedAt: true,
                        doctor: {
                                select: {
                                        id: true,
                                        name: true,
                                        specialty: true,
                                        avatar: true,
                                        opdFee: true,
                                },
                        },
                        payment: {
                                select: {
                                        id: true,
                                        amount: true,
                                        status: true,
                                        pidx: true,
                                        transactionId: true,
                                },
                        },
                },
        });

        const formattedAppointments: AppointmentWithDetails[] = result.data.map((apt: any) => ({
                id: apt.id,
                doctor: apt.doctor,
                startTime: apt.startTime.toISOString(),
                endTime: apt.endTime.toISOString(),
                status: apt.status,
                statusDisplay: getStatusDisplay(apt.status),
                formattedTime: `${format(apt.startTime, "h:mm a")} - ${format(apt.endTime, "h:mm a")}`,
                formattedDate: format(apt.startTime, "EEEE, MMMM d, yyyy"),
                patientDescription: apt.patientDescription,
                notes: apt.notes,
                payment: apt.payment,
                createdAt: apt.createdAt.toISOString(),
                updatedAt: apt.updatedAt.toISOString(),
        }));

        const stats = await prisma.appointment.groupBy({
                by: ["status"],
                where: {
                        patientId: user.id,
                },
                _count: true,
        });

        const statsMap = stats.reduce(
                (acc, item) => {
                        acc[item.status] = item._count;
                        return acc;
                },
                {} as Record<string, number>
        );

        return NextResponse.json(
                new ApiResponse(
                        200,
                        {
                                stats: {
                                        total: result.meta.total,
                                        scheduled: statsMap["SCHEDULED"] || 0,
                                        paymentPending: statsMap["PAYMENT_PENDING"] || 0,
                                        completed: statsMap["COMPLETED"] || 0,
                                        cancelled: statsMap["CANCELLED"] || 0,
                                },
                                pagination: {
                                        limit: result.meta.limit,
                                        total: result.meta.total,
                                        nextCursor: result.meta.nextCursor,
                                        hasMore: result.meta.hasNextPage,
                                },
                                appointments: formattedAppointments,
                        },
                        "Appointments fetched successfully"
                )
        );
}));


function getStatusDisplay(status: string): string {
        const statusMap: Record<string, string> = {
                SCHEDULED: "Scheduled",
                PAYMENT_PENDING: "Payment Pending",
                COMPLETED: "Completed",
                CANCELLED: "Cancelled",
        };
        return statusMap[status] || status;
}

export const GET = withAuth(handler);