-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "accessTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "otpAttempts" INTEGER NOT NULL DEFAULT 0;
