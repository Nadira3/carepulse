import cron from 'node-cron';
import dotenv from 'dotenv';
dotenv.config();

import { reminderService } from './modules/reminder/reminder.service';

console.log('[Worker] CarePulse reminder worker started');
console.log('[Worker] Environment:', process.env.NODE_ENV);

// Every 15 minutes — check for due reminders and send pending ones
cron.schedule('*/15 * * * *', async () => {
  console.log('[Worker] Checking due reminder schedules...');
  try {
    await reminderService.scheduleDueReminders();
    await reminderService.sendPendingReminders();
  } catch (err) {
    console.error('[Worker] Reminder cycle failed:', err);
  }
}, { timezone: 'Africa/Lagos' });

// Every hour — mark timed-out reminders as missed
cron.schedule('0 * * * *', async () => {
  console.log('[Worker] Checking timed-out reminders...');
  try {
    await reminderService.markTimedOutReminders();
  } catch (err) {
    console.error('[Worker] markTimedOutReminders failed:', err);
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
