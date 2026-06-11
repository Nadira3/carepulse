import { prisma } from '../../config/prisma';
import { openmrsClient } from '../../config/openmrs-client';
import { config } from '../../config/env';
import { NotFoundError } from '../../common/errors/app-errors';
import { CreateEncounterInput } from './encounter.validation';

export class EncounterService {
  async createEncounter(input: CreateEncounterInput) {
    // Verify patient exists in our DB
    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
    });
    if (!patient) {
      throw new NotFoundError('Patient', input.patientId);
    }

    // Attempt OpenMRS sync — fire and save pattern
    let openmrsUuid: string | null = null;
    let syncStatus: 'SYNCED' | 'FAILED' = 'FAILED';

    try {
      const omrsEncounter = await openmrsClient.post<{ uuid: string }>(
        '/encounter',
        {
          patient:       patient.openmrsUuid,
          encounterType: config.OPENMRS.ENCOUNTER_TYPE_UUID,
          encounterDatetime: `${input.encounterDate}T00:00:00.000+0000`,
          location:      config.OPENMRS.LOCATION_UUID,
          ...(input.clinicianName ? {
            encounterProviders: [{
              provider:      config.OPENMRS.PROVIDER_UUID,
              encounterRole: config.OPENMRS.ENCOUNTER_ROLE_UUID,
            }],
          } : {}),
        }
      );
      openmrsUuid = omrsEncounter.uuid;
      syncStatus  = 'SYNCED';
    } catch (err) {
      // Log but do not throw — save locally regardless
      console.error('[EncounterService] OpenMRS sync failed:', err);
    }

    const encounter = await prisma.encounter.create({
      data: {
        patientId:     input.patientId,
        type:          input.type,
        encounterDate: new Date(input.encounterDate),
        clinicianName: input.clinicianName,
        location:      input.location ?? null,
        notes:         input.notes ?? null,
        openmrsUuid,
        syncStatus,
      },
      include: { patient: true },
    });

    return encounter;
  }

  async listEncounters(params: {
    patientId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const page  = params.page  ?? 1;
    const limit = params.limit ?? 10;
    const skip  = (page - 1) * limit;

    const where = {
      ...(params.patientId ? { patientId: params.patientId } : {}),
      ...(params.type       ? { type: params.type as any }   : {}),
    };

    const [encounters, total] = await Promise.all([
      prisma.encounter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { encounterDate: 'desc' },
        include: { patient: true },
      }),
      prisma.encounter.count({ where }),
    ]);

    return {
      results: encounters,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEncounterById(id: string) {
    const encounter = await prisma.encounter.findUnique({
      where: { id },
      include: {
        patient:       true,
        prescriptions: true,
        observations:  true,
      },
    });
    if (!encounter) throw new NotFoundError('Encounter', id);
    return encounter;
  }
}

export const encounterService = new EncounterService();
