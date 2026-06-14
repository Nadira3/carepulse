-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "respondedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "adherence_records" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "medicationScheduled" INTEGER NOT NULL DEFAULT 0,
    "medicationConfirmed" INTEGER NOT NULL DEFAULT 0,
    "appointmentScheduled" INTEGER NOT NULL DEFAULT 0,
    "appointmentAttended" INTEGER NOT NULL DEFAULT 0,
    "adherenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adherence_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "adherence_records" ADD CONSTRAINT "adherence_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
