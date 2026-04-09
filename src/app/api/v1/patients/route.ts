import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, Gender, VerificationStatus } from "@prisma/client";
import { withAuth, AuthRequest } from "@/lib/withAuth";
import { ApiError } from "@/lib/ApiError";
import { ApiResponse } from "@/lib/ApiResponse";
import { asyncHandler } from "@/lib/AsyncHandler";
import appwriteStorageService from "@/lib/storage";

const handler = asyncHandler<AuthRequest>(async (req) => {
        const formData = await req.formData();
        const userId = formData.get("userId") as string;
        const phone = formData.get("phone") as string;
        const address = formData.get("address") as string;
        const gender = formData.get("gender")?.toString().toUpperCase() as Gender | null;
        const dob = formData.get("dob") as string;
        const avatar = formData.get("avatar") as File | null;

        if (!userId) {
                throw new ApiError(400, "User ID is required");
        }

        if (!phone && !address && !avatar && !gender && !dob) {
                throw new ApiError(400, "At least one field is required");
        }

        const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                        id: true,
                        role: true,
                        avatar: true,
                        phone: true,
                        address: true,
                        gender: true,
                        dob: true,
                },
        });

        if (!user) {
                throw new ApiError(404, "User not found");
        }

        if (user.role !== UserRole.UNASSIGNED) {
                throw new ApiError(400, "User role already assigned");
        }

        if (user.avatar && avatar) {
                try {
                        const oldFileId =
                                await appwriteStorageService.extractFileIdFromUrl(
                                        user.avatar
                                );

                        if (oldFileId) {
                                await appwriteStorageService.deleteFile(oldFileId);
                        }
                } catch (err) {
                        console.log("Old avatar delete failed:", err);
                }
        }

        let avatarUrl: string | null = user.avatar;

        if (avatar) {
                const uploadRes = await appwriteStorageService.uploadFile(avatar, {
                        maxSizeMB: 1,
                        allowedTypes: ["image/png", "image/jpeg"],
                });

                if (!uploadRes.success) {
                        throw new ApiError(400, uploadRes.error || "Avatar upload failed");
                }

                const fileId = uploadRes.data!.$id;
                avatarUrl = appwriteStorageService.getFileView(fileId);
        }

        const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                        role: UserRole.PATIENT,
                        phone: phone || user.phone,
                        address: address || user.address,
                        avatar: avatarUrl,
                        gender: gender || user.gender,
                        dob: dob ? new Date(dob) : user.dob,
                        isActive: true,
                        verificationStatus: VerificationStatus.VERIFIED,
                },
                select: {
                        id: true,
                        role: true,
                        phone: true,
                        address: true,
                        avatar: true,
                        gender: true,
                        dob: true,
                },
        });

        return NextResponse.json(
                new ApiResponse(200, updatedUser, "Patient profile updated successfully")
        );
});

export const PATCH = withAuth(handler);