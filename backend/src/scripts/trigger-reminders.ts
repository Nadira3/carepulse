import dotenv from 'dotenv';
dotenv.config();

import { reminderService } from '../modules/reminder/reminder.service';

async function main() {
  console.log('=== CarePulse Manual Reminder Trigger ===');
  console.log('');

  console.log('Step 1: Scheduling medication reminders...');
  await reminderService.scheduleMedicationReminders();
  console.log('Done.');

  console.log('Step 2: Sending pending reminders...');
  await reminderService.sendPendingReminders();
  console.log('Done.');

  console.log('');
  console.log('Check your phone. SMS should arrive within 30 seconds.');
  process.exit(0);
}

main().catch(err => {
  console.error('Trigger failed:', err);
  process.exit(1);
});
