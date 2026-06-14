import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
});

export const getPatientByUuidSchema = z.object({
  uuid: z.string().uuid('Invalid patient UUID format'),
});

export const createPatientSchema = z.object({
  // Personal
  givenName:         z.string().min(1, 'First name is required'),
  familyName:        z.string().min(1, 'Last name is required'),
  gender:            z.enum(['M', 'F'] as const, { message: 'Gender must be M or F' }),
  age:               z.number().int().min(0).max(150).optional(),
  birthdate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional(),
  phone:             z.string().min(1, 'Phone number is required'),
  occupation:        z.string().min(1, 'Occupation is required'),
  preferredLanguage: z.enum(['English', 'Pidgin English'] as const).default('English'),
  preferredChannel:  z.enum(['SMS', 'VOICE'] as const).default('SMS'),

  // Clinical
  primaryDiagnosis:   z.string().min(1, 'Primary diagnosis is required'),
  secondaryCondition: z.string().optional(),
  clinicianName:      z.string().min(1, 'Clinician name is required'),
  ward:               z.string().min(1, 'Ward is required'),

  // Enrolment
  identifier:    z.string().min(1, 'Patient identifier is required'),
  enrolmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  consentGiven:  z.boolean().refine(val => val === true, {
    message: 'Patient consent is required',
  }),
});

export const updatePatientSchema = z.object({
  // Clinical fields only — personal details locked after registration
  primaryDiagnosis:   z.string().min(1).optional(),
  secondaryCondition: z.string().optional(),
  clinicianName:      z.string().min(1).optional(),
  ward:               z.string().min(1).optional(),
  phone:              z.string().min(1).optional(),
  preferredLanguage:  z.enum(['English', 'Pidgin English'] as const).optional(),
  preferredChannel:   z.enum(['SMS', 'VOICE'] as const).optional(),
});

export const updateAppointmentSchema = z.object({
  nextAppointmentDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  nextAppointmentLocation: z.string().min(1, 'Location is required'),
  apptReminderThreeDays:   z.boolean().default(true),
  apptReminderMorning:     z.boolean().default(true),
});

export const getPatientByIdSchema = z.object({
  id: z.string().uuid('Invalid patient UUID'),
});

export type CreatePatientInput     = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput     = z.infer<typeof updatePatientSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
