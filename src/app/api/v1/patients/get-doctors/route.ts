import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";
import { prismaCursorPagination } from "@/lib/prismaCursorPagination";
import { withRole } from "@/lib/withRole";

const handler = asyncHandler<AuthRequest>(async (req) => {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "10");
        const cursor = searchParams.get("cursor") || undefined;
        const search = searchParams.get("search") || "";
        const where = {
                role: UserRole.DOCTOR,
                verificationStatus: "VERIFIED",
                isActive: true,
                ...(search
                        ? {
                                OR: [
                                        { name: { contains: search, mode: "insensitive" } },
                                        { email: { contains: search, mode: "insensitive" } },
                                        { specialty: { contains: search, mode: "insensitive" } },
                                ],
                        }
                        : {}),
        };
        const result = await prismaCursorPagination({
                model: prisma.user,
                where,
                limit,
                cursor,
                orderBy: { createdAt: "desc" },
                select: {
                        id: true,
                        name: true,
                        email: true,
                        specialty: true,
                        experience: true,
                        description: true,
                        avatar: true,
                        gender: true,
                        dob: true,
                        phone: true,
                        address: true,
                        opdFee: true,
                        credentialUrl: true,
                        verificationStatus: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                },
        });

        return NextResponse.json(
                new ApiResponse(200, result, "Doctors fetched successfully")
        );
});

export const GET = withAuth(
        withRole([UserRole.PATIENT], handler)
);

