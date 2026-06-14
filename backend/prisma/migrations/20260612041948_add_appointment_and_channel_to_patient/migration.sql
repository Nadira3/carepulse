-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "apptReminderMorning" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "apptReminderThreeDays" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nextAppointmentDate" TIMESTAMP(3),
ADD COLUMN     "nextAppointmentLocation" TEXT,
ADD COLUMN     "preferredChannel" "Channel" NOT NULL DEFAULT 'SMS';
