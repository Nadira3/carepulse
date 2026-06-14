import cron from 'node-cron';
import dotenv from 'dotenv';
dotenv.config();

import { reminderService } from './modules/reminder/reminder.service';

console.log('[Worker] CarePulse reminder worker started');
console.log('[Worker] Environment:', process.env.NODE_ENV);

// Every 15 minutes — check due reminders and send pending
cron.schedule('*/15 * * * *', async () => {
  console.log('[Worker] Reminder cycle starting...');
  try {
    await reminderService.scheduleDueReminders();
    await reminderService.sendPendingReminders();
  } catch (err) {
    console.error('[Worker] Reminder cycle failed:', err);
  }
}, { timezone: 'Africa/Lagos' });

// Every hour — mark timed-out reminders as missed
cron.schedule('0 * * * *', async () => {
  try {
    await reminderService.markTimedOutReminders();
  } catch (err) {
    console.error('[Worker] markTimedOutReminders failed:', err);
  }
}, { timezone: 'Africa/Lagos' });

// Every day at 08:00 — check for appointment reminders (3 days before + morning of)
cron.schedule('0 8 * * *', async () => {
  console.log('[Worker] Checking appointment reminders...');
  try {
    await reminderService.scheduleAppointmentReminders();
  } catch (err) {
    console.error('[Worker] scheduleAppointmentReminders failed:', err);
  }
}, { timezone: 'Africa/Lagos' });

// Every Monday 09:00 — lifestyle tips for low-adherence patients
cron.schedule('0 9 * * 1', async () => {
  console.log('[Worker] Sending lifestyle tips...');
  try {
    await reminderService.sendLifestyleTips();
  } catch (err) {
    console.error('[Worker] sendLifestyleTips failed:', err);
  }
}, { timezone: 'Africa/Lagos' });

console.log('[Worker] Cron jobs registered. Waiting...');
