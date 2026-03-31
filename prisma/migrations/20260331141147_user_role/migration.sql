/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('UNASSIGNED', 'PATIENT', 'DOCTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "credentialUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "experience" INTEGER,
ADD COLUMN     "specialty" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" DEFAULT 'PENDING',
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'UNASSIGNED';

-- DropEnum
DROP TYPE "Role";
