import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
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
        const specialty = formData.get("specialty") as string;
        const experience = formData.get("experience") as string;
        const description = formData.get("description") as string;
        const opdFee = formData.get("opdFee") as string;
        const avatar = formData.get("avatar") as File | null;
        const credentialFile = formData.get("credential") as File | null;

        if (!userId) {
                throw new ApiError(400, "User ID is required");
        }

        const user = await prisma.user.findUnique({
                where: { id: userId },
        });

        if (!user) {
                throw new ApiError(404, "User not found");
        }

        if (!specialty || !experience) {
                throw new ApiError(400, "Specialty and experience are required");
        }

        if (user.avatar) {
                try {
                        const oldFileId = await appwriteStorageService.extractFileIdFromUrl(
                                user.avatar
                        );

                        if (oldFileId) {
                                await appwriteStorageService.deleteFile(oldFileId ?? "");
                        }
                } catch (err) {
                        console.log("Old file delete failed:", err);
                }
        }
        if (user.credentialUrl) {
                try {
                        const oldFileId = await appwriteStorageService.extractFileIdFromUrl(
                                user.credentialUrl!
                        );

                        if (oldFileId) {
                                await appwriteStorageService.deleteFile(oldFileId ?? "");
                        }
                } catch (err) {
                        console.log("Old file delete failed:", err);
                }
        }

        let credentialUrl: string | null = user.credentialUrl;
        let avatarUrl: string | null = user.avatar;

        if (avatar) {
                const uploadRes = await appwriteStorageService.uploadFile(avatar, {
                        maxSizeMB: 1,
                        allowedTypes: ["image/png", "image/jpeg"],
                });

                if (!uploadRes.success) {
                        throw new ApiError(400, uploadRes.error || "File upload failed");
                }

                const fileId = uploadRes.data!.$id;
                avatarUrl = appwriteStorageService.getFileView(fileId);
        }

        if (credentialFile) {
                const uploadRes = await appwriteStorageService.uploadFile(
                        credentialFile,
                        {
                                maxSizeMB: 1,
                                allowedTypes: [
                                        "image/png",
                                        "image/jpeg",
                                        "application/pdf",
                                ],
                        }
                );

                if (!uploadRes.success) {
                        throw new ApiError(400, uploadRes.error || "File upload failed");
                }

                const fileId = uploadRes.data!.$id;
                credentialUrl = appwriteStorageService.getFileView(fileId);
        }

        const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                        role: UserRole.DOCTOR,
                        phone,
                        address,
                        specialty,
                        experience: parseInt(experience),
                        description,
                        opdFee: opdFee ? parseInt(opdFee) : null,
                        credentialUrl,
                        avatar: avatarUrl,
                        verificationStatus: "PENDING",
                },
                select: {
                        id: true,
                        role: true,
                        credentialUrl: true,
                        avatar: true,
                },
        });

        return NextResponse.json(
                new ApiResponse(
                        200,
                        updatedUser,
                        "Doctor profile updated successfully"
                )
        );
});

export const PATCH = withAuth(handler);