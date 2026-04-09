const conf = {
        appwriteUrl: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
        appwriteProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
        appwriteBucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID! as string,
};

if (!conf.appwriteUrl || !conf.appwriteProjectId || !conf.appwriteBucketId) {
        throw new Error("Missing Appwrite environment variables");
}

export default conf;