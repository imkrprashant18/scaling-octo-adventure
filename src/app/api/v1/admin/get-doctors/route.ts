import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";
import { prismaCursorPagination } from "@/lib/prismaCursorPagination";

const handler = asyncHandler<AuthRequest>(async (req) => {
        const user = req.user;
        if (user.role !== UserRole.ADMIN) {
                throw new ApiError(403, "Only admin can access this resource");
        }
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "10");
        const cursor = searchParams.get("cursor") || undefined;
        const search = searchParams.get("search") || "";
        const where = {
                role: UserRole.DOCTOR,
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

export const GET = withAuth(handler);