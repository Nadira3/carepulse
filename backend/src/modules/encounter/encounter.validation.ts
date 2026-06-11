import { z } from 'zod';

export const createEncounterSchema = z.object({
  patientId:     z.string().uuid('Invalid patient UUID'),
  type:          z.enum(['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'FOLLOW_UP', 'INITIAL']),
  encounterDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  clinicianName: z.string().min(1, 'Clinician name is required'),
  location:      z.string().optional(),
  notes:         z.string().optional(),
});

export const listEncountersSchema = z.object({
  patientId: z.string().uuid('Invalid patient UUID').optional(),
  type:      z.enum(['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'FOLLOW_UP', 'INITIAL']).optional(),
  page:      z.string().regex(/^\d+$/).transform(Number).optional(),
  limit:     z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const getEncounterByIdSchema = z.object({
  id: z.string().uuid('Invalid encounter UUID'),
});

export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
