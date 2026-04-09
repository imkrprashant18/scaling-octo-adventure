import conf from "@/lib/appwriteConfig";
import { Client, Storage, ID, Models, AppwriteException } from "appwrite";

type UploadResponse = {
        success: boolean;
        data?: Models.File;
        error?: string;
};

class AppwriteStorageService {
        private client: Client;
        private storage: Storage;
        private bucketId: string;

        constructor() {
                this.client = new Client()
                        .setEndpoint(conf.appwriteUrl)
                        .setProject(conf.appwriteProjectId);

                this.storage = new Storage(this.client);
                this.bucketId = conf.appwriteBucketId;
        }


        async uploadFile(
                file: File,
                options?: {
                        allowedTypes?: string[];
                        maxSizeMB?: number;
                }
        ): Promise<UploadResponse> {
                try {
                        const maxSize = (options?.maxSizeMB ?? 5) * 1024 * 1024;

                        if (file.size > maxSize) {
                                return {
                                        success: false,
                                        error: `File too large. Max allowed is ${options?.maxSizeMB ?? 5}MB`,
                                };
                        }

                        if (
                                options?.allowedTypes &&
                                !options.allowedTypes.includes(file.type)
                        ) {
                                return {
                                        success: false,
                                        error: `Invalid file type: ${file.type}`,
                                };
                        }

                        const uploadedFile = await this.storage.createFile(
                                this.bucketId,
                                ID.unique(),
                                file
                        );

                        return {
                                success: true,
                                data: uploadedFile,
                        };
                } catch (error) {
                        const err = error as AppwriteException;

                        console.error("Appwrite Upload Error:", err.message);

                        return {
                                success: false,
                                error: err.message || "File upload failed",
                        };
                }
        }
        async extractFileIdFromUrl(url: string): Promise<string | null> {
                try {
                        if (!url) return null;

                        const cleanUrl = url.split("?")[0];

                        const match = cleanUrl.match(/files\/([^/]+)/);

                        return match ? match[1] : null;
                } catch (error) {
                        console.error("Failed to extract file id:", error);
                        return null;
                }
        }
        async deleteFile(fileId: string): Promise<UploadResponse> {
                try {
                        await this.storage.deleteFile(this.bucketId, fileId);

                        return {
                                success: true,
                        };
                } catch (error) {
                        const err = error as AppwriteException;

                        console.error("Appwrite Delete Error:", err.message);

                        return {
                                success: false,
                                error: err.message || "File delete failed",
                        };
                }
        }

        getFileView(fileId: string): string {
                return this.storage.getFileView(this.bucketId, fileId);
        }

        getFilePreview(fileId: string): string {
                return this.storage.getFilePreview(this.bucketId, fileId);
        }

        async getFile(fileId: string): Promise<UploadResponse> {
                try {
                        const file = await this.storage.getFile(this.bucketId, fileId);

                        return {
                                success: true,
                                data: file,
                        };
                } catch (error) {
                        const err = error as AppwriteException;

                        return {
                                success: false,
                                error: err.message || "Failed to fetch file",
                        };
                }
        }
}

const appwriteStorageService = new AppwriteStorageService();
export default appwriteStorageService;