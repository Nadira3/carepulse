import { z } from 'zod';

export const atWebhookSchema = z.object({
  from:     z.string().min(1),
  to:       z.string().min(1),
  text:     z.string().min(1),
  date:     z.string().optional(),
  id:       z.string().optional(),
  linkId:   z.string().optional(),
});

export const listRemindersSchema = z.object({
  patientId: z.string().uuid('Invalid patient UUID').optional(),
  type:      z.enum(['MEDICATION', 'APPOINTMENT', 'LIFESTYLE']).optional(),
  status:    z.enum(['PENDING', 'SENT', 'FAILED', 'CANCELLED']).optional(),
  page:      z.string().regex(/^\d+$/).transform(Number).optional(),
  limit:     z.string().regex(/^\d+$/).transform(Number).optional(),
});
