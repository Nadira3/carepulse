import { Request, Response, NextFunction } from 'express';
import { reminderService } from './reminder.service';
import { prisma } from '../../config/prisma';
import { atWebhookSchema, listRemindersSchema } from './reminder.validation';

export class ReminderController {
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = atWebhookSchema.parse(req.body);
      await reminderService.handleReply(body.from, body.text);
      res.status(200).send('OK');
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listRemindersSchema.parse(req.query);
      const page  = query.page  ?? 1;
      const limit = query.limit ?? 20;
      const skip  = (page - 1) * limit;

      const where = {
        ...(query.patientId ? { patientId: query.patientId } : {}),
        ...(query.type      ? { type:      query.type }      : {}),
        ...(query.status    ? { status:    query.status }    : {}),
      };

      const [reminders, total] = await Promise.all([
        prisma.reminder.findMany({
          where,
          skip,
          take:    limit,
          orderBy: { scheduledAt: 'desc' },
          include: { patient: true },
        }),
        prisma.reminder.count({ where }),
      ]);

      res.status(200).json({
        results: reminders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }

  async trigger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await reminderService.scheduleMedicationReminders();
      await reminderService.sendPendingReminders();
      res.status(200).json({ message: 'Reminders scheduled and sent successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const reminderController = new ReminderController();
