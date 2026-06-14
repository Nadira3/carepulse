import { prisma } from '../../config/prisma';
import { generateReminderMessage } from '../../common/utils/gemini.client';
import { deliverMessage } from '../../common/utils/delivery.client';
import { adherenceService } from '../adherence/adherence.service';

export class ReminderService {
  // Called by cron every 15 minutes
  async scheduleDueReminders(): Promise<void> {
    const now     = new Date();
    const window  = new Date(now.getTime() + 15 * 60 * 1000);

    const currentTime = now.toTimeString().slice(0, 5);
    const windowTime  = window.toTimeString().slice(0, 5);

    const schedules = await prisma.reminderSchedule.findMany({
      where: {
        isActive: true,
        doseTime: { gte: currentTime, lte: windowTime },
      },
      include: { prescription: true, patient: true },
    });

    for (const schedule of schedules) {
      const patient      = schedule.patient;
      const prescription = schedule.prescription;

      if (!patient.phone)       continue;
      if (!prescription.active) continue;

      const today    = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existing = await prisma.reminder.findFirst({
        where: {
          patientId:      patient.id,
          prescriptionId: prescription.id,
          type:           'MEDICATION',
          scheduledAt:    { gte: today, lt: tomorrow },
          message:        { contains: schedule.doseTime },
        },
      });

      if (existing) continue;

      let message: string;
      try {
        message = await generateReminderMessage({
          patientName:  patient.givenName,
          language:     patient.preferredLanguage,
          disease:      patient.primaryDiagnosis ?? 'your condition',
          drugName:     prescription.drugName,
          dose:         prescription.dose,
          frequency:    prescription.frequency,
          reminderType: 'MEDICATION',
        });
      } catch (err) {
        console.error(`[ReminderService] Gemini failed for patient ${patient.id}:`, err);
        message = `Hi ${patient.givenName}, time to take your ${prescription.drugName} ${prescription.dose} (${schedule.doseTime}). Reply CONFIRM when taken or SNOOZE for 1 hour.`;
      }

      await prisma.reminder.create({
        data: {
          patientId:      patient.id,
          prescriptionId: prescription.id,
          type:           'MEDICATION',
          scheduledAt:    now,
          message,
          channel:        patient.preferredChannel,
          status:         'PENDING',
        },
      });
    }
  }

  // Legacy — used by trigger script
  async scheduleMedicationReminders(): Promise<void> {
    const prescriptions = await prisma.prescription.findMany({
      where:   { active: true },
      include: { patient: true },
    });

    for (const rx of prescriptions) {
      const patient = rx.patient;
      if (!patient.phone) continue;

      const today    = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existing = await prisma.reminder.findFirst({
        where: {
          patientId:      patient.id,
          prescriptionId: rx.id,
          type:           'MEDICATION',
          scheduledAt:    { gte: today, lt: tomorrow },
        },
      });

      if (existing) continue;

      const doseTimes = rx.doseTimes.length > 0 ? rx.doseTimes : ['08:00'];

      for (const doseTime of doseTimes) {
        let message: string;
        try {
          message = await generateReminderMessage({
            patientName:  patient.givenName,
            language:     patient.preferredLanguage,
            disease:      patient.primaryDiagnosis ?? 'your condition',
            drugName:     rx.drugName,
            dose:         rx.dose,
            frequency:    rx.frequency,
            reminderType: 'MEDICATION',
          });
        } catch (err) {
          console.error(`[ReminderService] Gemini failed for patient ${patient.id}:`, err);
          message = `Hi ${patient.givenName}, time to take your ${rx.drugName} ${rx.dose} (${doseTime}). Reply CONFIRM when taken or SNOOZE for 1 hour.`;
        }

        // Set scheduledAt to the actual dose time today in UTC
        // Dose times are in Africa/Lagos (WAT = UTC+1)
        const [hours, minutes] = doseTime.split(':').map(Number);
        const scheduledAt = new Date();
        // Convert WAT to UTC by subtracting 1 hour
        scheduledAt.setUTCHours(hours - 1, minutes, 0, 0);

        await prisma.reminder.create({
          data: {
            patientId:      patient.id,
            prescriptionId: rx.id,
            type:           'MEDICATION',
            scheduledAt,
            message,
            channel:        patient.preferredChannel,
            status:         'PENDING',
          },
        });
      }
    }
  }

  async sendPendingReminders(): Promise<void> {
    const now     = new Date();
    const pending = await prisma.reminder.findMany({
      where: {
        status:      'PENDING',
        scheduledAt: { lte: now },  // only send reminders whose time has come
      },
      include: { patient: true },
    });

    for (const reminder of pending) {
      const patient = reminder.patient;
      if (!patient.phone) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data:  { status: 'FAILED', failedAt: new Date() },
        });
        continue;
      }

      const result = await deliverMessage(
        patient.phone,
        reminder.message,
        reminder.channel,
      );

      await prisma.reminder.update({
        where: { id: reminder.id },
        data:  {
          status:   result.success ? 'SENT'    : 'FAILED',
          sentAt:   result.success ? new Date() : null,
          failedAt: result.success ? null        : new Date(),
          channel:  result.channel as any,
        },
      });

      if (!result.success) {
        console.error(`[ReminderService] Delivery failed for ${patient.id}: ${result.error}`);
      }
    }
  }

  async markTimedOutReminders(): Promise<void> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 4);

    const timedOut = await prisma.reminder.findMany({
      where: {
        status:      'SENT',
        sentAt:      { lte: cutoff },
        confirmedAt: null,
      },
    });

    for (const reminder of timedOut) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data:  { status: 'FAILED', failedAt: new Date() },
      });
      await adherenceService.calculateAndStore(reminder.patientId);
    }
  }

  async scheduleAppointmentReminders(): Promise<void> {
    const now = new Date();

    // Find patients with upcoming appointments
    const patients = await prisma.patient.findMany({
      where: {
        consentGiven:        true,
        nextAppointmentDate: { gte: now },
        phone:               { not: null },
      },
    });

    for (const patient of patients) {
      if (!patient.nextAppointmentDate) continue;

      const apptDate   = new Date(patient.nextAppointmentDate);
      const daysUntil  = Math.ceil(
        (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 3-day reminder
      if (daysUntil === 3 && patient.apptReminderThreeDays) {
        await this.sendAppointmentReminder(patient, apptDate, '3 days');
      }

      // Morning-of reminder
      const isToday = apptDate.toDateString() === now.toDateString();
      if (isToday && patient.apptReminderMorning) {
        await this.sendAppointmentReminder(patient, apptDate, 'today');
      }
    }
  }

  private async sendAppointmentReminder(
    patient:  any,
    apptDate: Date,
    when:     string,
  ): Promise<void> {
    // Check not already sent today for this appointment
    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.reminder.findFirst({
      where: {
        patientId: patient.id,
        type:      'APPOINTMENT',
        scheduledAt: { gte: today, lt: tomorrow },
      },
    });

    if (existing) return;

    let message: string;
    try {
      message = await generateReminderMessage({
        patientName:         patient.givenName,
        language:            patient.preferredLanguage,
        disease:             patient.primaryDiagnosis ?? 'your condition',
        reminderType:        'APPOINTMENT',
        appointmentDate:     apptDate.toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long',
        }),
        appointmentLocation: patient.nextAppointmentLocation ?? 'the clinic',
      });
    } catch (err) {
      console.error(`[ReminderService] Gemini appt reminder failed for ${patient.id}:`, err);
      message = `Hi ${patient.givenName}, reminder: your appointment is ${when} at ${patient.nextAppointmentLocation ?? 'the clinic'}. Reply CONFIRM to confirm or RESCHEDULE to reschedule.`;
    }

    const reminder = await prisma.reminder.create({
      data: {
        patientId:   patient.id,
        type:        'APPOINTMENT',
        scheduledAt: new Date(),
        message,
        channel:     patient.preferredChannel,
        status:      'PENDING',
      },
    });

    const result = await deliverMessage(
      patient.phone,
      message,
      patient.preferredChannel,
    );

    await prisma.reminder.update({
      where: { id: reminder.id },
      data:  {
        status:   result.success ? 'SENT'    : 'FAILED',
        sentAt:   result.success ? new Date() : null,
        failedAt: result.success ? null        : new Date(),
        channel:  result.channel as any,
      },
    });
  }

  async sendLifestyleTips(): Promise<void> {
    const patients = await prisma.patient.findMany({
      where: { consentGiven: true },
    });

    for (const patient of patients) {
      if (!patient.phone) continue;

      const needsTip = await adherenceService.needsLifestyleTip(patient.id);
      if (!needsTip) continue;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentTip = await prisma.reminder.findFirst({
        where: {
          patientId: patient.id,
          type:      'LIFESTYLE',
          createdAt: { gte: weekAgo },
        },
      });

      if (recentTip) continue;

      let message: string;
      try {
        message = await generateReminderMessage({
          patientName:  patient.givenName,
          language:     patient.preferredLanguage,
          disease:      patient.primaryDiagnosis ?? 'your condition',
          reminderType: 'LIFESTYLE',
        });
      } catch (err) {
        console.error(`[ReminderService] Gemini lifestyle tip failed for ${patient.id}:`, err);
        continue;
      }

      const reminder = await prisma.reminder.create({
        data: {
          patientId:   patient.id,
          type:        'LIFESTYLE',
          scheduledAt: new Date(),
          message,
          channel:     patient.preferredChannel,
          status:      'PENDING',
        },
      });

      const result = await deliverMessage(
        patient.phone,
        message,
        patient.preferredChannel,
      );

      await prisma.reminder.update({
        where: { id: reminder.id },
        data:  {
          status:   result.success ? 'SENT'    : 'FAILED',
          sentAt:   result.success ? new Date() : null,
          failedAt: result.success ? null        : new Date(),
          channel:  result.channel as any,
        },
      });
    }
  }

  async handleReply(phone: string, message: string): Promise<void> {
    const normalised = message.trim().toUpperCase();

    const patient = await prisma.patient.findFirst({
      where: { phone: { contains: phone.replace('+', '') } },
    });

    if (!patient) {
      console.warn(`[ReminderService] Reply from unknown number: ${phone}`);
      return;
    }

    const reminder = await prisma.reminder.findFirst({
      where:   { patientId: patient.id, status: 'SENT' },
      orderBy: { sentAt: 'desc' },
    });

    if (!reminder) return;

    if (normalised === 'CONFIRM') {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data:  { status: 'SENT', confirmedAt: new Date() },
      });
      await adherenceService.calculateAndStore(patient.id);

    } else if (normalised === 'SNOOZE') {
      const snoozedAt = new Date();
      snoozedAt.setHours(snoozedAt.getHours() + 1);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data:  { scheduledAt: snoozedAt, status: 'PENDING' },
      });

    } else if (normalised === 'RESCHEDULE') {
      // Appointment reschedule request — flag for clinician follow-up
      await prisma.reminder.update({
        where: { id: reminder.id },
        data:  { status: 'CANCELLED', respondedAt: new Date() },
      });
      console.log(`[ReminderService] Patient ${patient.id} requested appointment reschedule`);
    }
  }
}

export const reminderService = new ReminderService();
