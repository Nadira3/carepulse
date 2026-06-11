import { z } from 'zod';

export const createPrescriptionSchema = z.object({
  patientId:      z.string().uuid('Invalid patient UUID'),
  encounterId:    z.string().uuid('Invalid encounter UUID'),
  drugName:       z.string().min(1, 'Drug name is required'),
  dose:           z.string().min(1, 'Dose is required'),
  frequency:      z.string().min(1, 'Frequency is required'),
  frequencyHours: z.number().int().min(1).max(24).default(24),
  doseTimes:      z.array(
    z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format')
  ).min(1, 'At least one dose time is required'),
  duration:       z.string().min(1, 'Duration is required'),
  instructions:   z.string().optional(),
  startDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  endDate:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional(),
});

export const updatePrescriptionStatusSchema = z.object({
  active: z.boolean(),
});

export const listPrescriptionsSchema = z.object({
  patientId:   z.string().uuid('Invalid patient UUID').optional(),
  encounterId: z.string().uuid('Invalid encounter UUID').optional(),
  active:      z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  page:        z.string().regex(/^\d+$/).transform(Number).optional(),
  limit:       z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const getPrescriptionByIdSchema = z.object({
  id: z.string().uuid('Invalid prescription UUID'),
});

export type CreatePrescriptionInput  = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionStatus = z.infer<typeof updatePrescriptionStatusSchema>;
