import { prisma } from '../../config/prisma';
import { openmrsClient } from '../../config/openmrs-client';
import { NotFoundError } from '../../common/errors/app-errors';
import { CreatePrescriptionInput, UpdatePrescriptionStatus } from './prescription.validation';

const MEDICATION_ORDER_CONCEPT = '162169AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export class PrescriptionService {
  async createPrescription(input: CreatePrescriptionInput) {
    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
    });
    if (!patient) throw new NotFoundError('Patient', input.patientId);

    const encounter = await prisma.encounter.findUnique({
      where: { id: input.encounterId },
    });
    if (!encounter) throw new NotFoundError('Encounter', input.encounterId);
    if (encounter.patientId !== input.patientId) {
      throw new NotFoundError('Encounter', input.encounterId);
    }

    // Sync to OpenMRS as obs
    let openmrsOrderUuid: string | null = null;
    let syncStatus: 'SYNCED' | 'FAILED' = 'FAILED';

    if (encounter.openmrsUuid && patient.openmrsUuid) {
      try {
        const obsValue =
          `${input.drugName} ${input.dose} — ${input.frequency} for ${input.duration}` +
          ` (${input.doseTimes.join(', ')})` +
          (input.instructions ? ` — ${input.instructions}` : '');

        const omrsObs = await openmrsClient.post<{ uuid: string }>('/obs', {
          person:      patient.openmrsUuid,
          encounter:   encounter.openmrsUuid,
          concept:     MEDICATION_ORDER_CONCEPT,
          value:       obsValue,
          obsDatetime: `${input.startDate}T00:00:00.000+0000`,
        });
        openmrsOrderUuid = omrsObs.uuid;
        syncStatus       = 'SYNCED';
      } catch (err) {
        console.error('[PrescriptionService] OpenMRS sync failed:', err);
      }
    }

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        patientId:       input.patientId,
        encounterId:     input.encounterId,
        drugName:        input.drugName,
        dose:            input.dose,
        frequency:       input.frequency,
        frequencyHours:  input.frequencyHours,
        doseTimes:       input.doseTimes,
        duration:        input.duration,
        instructions:    input.instructions ?? null,
        startDate:       new Date(input.startDate),
        endDate:         input.endDate ? new Date(input.endDate) : null,
        active:          true,
        openmrsOrderUuid,
        syncStatus,
      },
      include: { patient: true, encounter: true },
    });

    // Create one ReminderSchedule row per dose time
    await prisma.reminderSchedule.createMany({
      data: input.doseTimes.map(time => ({
        prescriptionId: prescription.id,
        patientId:      input.patientId,
        doseTime:       time,
        frequencyHours: input.frequencyHours,
        isActive:       true,
      })),
    });

    return prescription;
  }

  async listPrescriptions(params: {
    patientId?:   string;
    encounterId?: string;
    active?:      boolean;
    page?:        number;
    limit?:       number;
  }) {
    const page  = params.page  ?? 1;
    const limit = params.limit ?? 10;
    const skip  = (page - 1) * limit;

    const where = {
      ...(params.patientId   ? { patientId:   params.patientId }   : {}),
      ...(params.encounterId ? { encounterId: params.encounterId } : {}),
      ...(params.active !== undefined ? { active: params.active }  : {}),
    };

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { patient: true, encounter: true },
      }),
      prisma.prescription.count({ where }),
    ]);

    return {
      results: prescriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPrescriptionById(id: string) {
    const prescription = await prisma.prescription.findUnique({
      where:   { id },
      include: {
        patient:           true,
        encounter:         true,
        reminders:         true,
        reminderSchedules: true,
      },
    });
    if (!prescription) throw new NotFoundError('Prescription', id);
    return prescription;
  }

  async updateStatus(id: string, input: UpdatePrescriptionStatus) {
    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Prescription', id);

    // Deactivate reminder schedules when prescription is deactivated
    await prisma.reminderSchedule.updateMany({
      where: { prescriptionId: id },
      data:  { isActive: input.active },
    });

    return prisma.prescription.update({
      where:   { id },
      data:    { active: input.active },
      include: { patient: true, encounter: true },
    });
  }
}

export const prescriptionService = new PrescriptionService();
