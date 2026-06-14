/*
  Warnings:

  - Changed the type of `gender` on the `patients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "clinicianName" TEXT,
ADD COLUMN     "consentGiven" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enrolmentDate" TIMESTAMP(3),
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "preferredLanguage" TEXT NOT NULL DEFAULT 'English',
ADD COLUMN     "primaryDiagnosis" TEXT,
ADD COLUMN     "secondaryCondition" TEXT,
ADD COLUMN     "ward" TEXT,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL;

-- AlterTable
ALTER TABLE "prescriptions" ALTER COLUMN "openmrsOrderUuid" DROP NOT NULL;
