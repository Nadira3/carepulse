import { prisma } from '../../config/prisma';
import { config } from '../../config/env';

export class AdherenceService {
  async calculateAndStore(patientId: string): Promise<number> {
    const now         = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 30);

    // Medication reminders in last 30 days
    const medReminders = await prisma.reminder.findMany({
      where: {
        patientId,
        type:        'MEDICATION',
        scheduledAt: { gte: periodStart, lte: now },
        status:      { in: ['SENT', 'FAILED', 'CANCELLED'] },
      },
    });

    const medScheduled  = medReminders.length;
    const medConfirmed  = medReminders.filter(r => r.confirmedAt !== null).length;

    // Appointment reminders in last 30 days
    const apptReminders = await prisma.reminder.findMany({
      where: {
        patientId,
        type:        'APPOINTMENT',
        scheduledAt: { gte: periodStart, lte: now },
        status:      { in: ['SENT', 'FAILED', 'CANCELLED'] },
      },
    });

    const apptScheduled = apptReminders.length;
    const apptAttended  = apptReminders.filter(r => r.confirmedAt !== null).length;

    // Weighted score: medication 70%, appointment 30%
    let score = 0;
    if (medScheduled > 0 || apptScheduled > 0) {
      const medScore  = medScheduled  > 0 ? (medConfirmed  / medScheduled)  * 100 : 100;
      const apptScore = apptScheduled > 0 ? (apptAttended  / apptScheduled) * 100 : 100;
      score = medScheduled > 0 && apptScheduled > 0
        ? (medScore * 0.7) + (apptScore * 0.3)
        : medScheduled > 0 ? medScore : apptScore;
    }

    score = Math.round(score * 10) / 10;

    // Upsert adherence record for this period
    await prisma.adherenceRecord.upsert({
      where: {
        // Use composite find since there's no unique constraint — find latest
        id: (await prisma.adherenceRecord.findFirst({
          where:   { patientId, periodStart: { gte: periodStart } },
          orderBy: { createdAt: 'desc' },
        }))?.id ?? 'new-record',
      },
      update: {
        medicationScheduled:  medScheduled,
        medicationConfirmed:  medConfirmed,
        appointmentScheduled: apptScheduled,
        appointmentAttended:  apptAttended,
        adherenceScore:       score,
        periodEnd:            now,
      },
      create: {
        patientId,
        periodStart,
        periodEnd:            now,
        medicationScheduled:  medScheduled,
        medicationConfirmed:  medConfirmed,
        appointmentScheduled: apptScheduled,
        appointmentAttended:  apptAttended,
        adherenceScore:       score,
      },
    });

    return score;
  }

  async getLatestScore(patientId: string): Promise<number> {
    const record = await prisma.adherenceRecord.findFirst({
      where:   { patientId },
      orderBy: { createdAt: 'desc' },
    });
    return record?.adherenceScore ?? 0;
  }

  async needsLifestyleTip(patientId: string): Promise<boolean> {
    const score = await this.getLatestScore(patientId);
    return score < config.REMINDER.LIFESTYLE_ADHERENCE_THRESHOLD;
  }
}

export const adherenceService = new AdherenceService();
