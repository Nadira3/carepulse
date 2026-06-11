import { EncounterService } from './encounter.service';
import { prisma } from '../../config/prisma';
import { openmrsClient } from '../../config/openmrs-client';
import { NotFoundError } from '../../common/errors/app-errors';

jest.mock('../../config/prisma', () => ({
  prisma: {
    patient:   { findUnique: jest.fn() },
    encounter: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
  },
}));

jest.mock('../../config/openmrs-client', () => ({
  openmrsClient: { post: jest.fn() },
}));

const mockPatient = {
  id:          'patient-uuid-1',
  openmrsUuid: 'omrs-patient-uuid-1',
  givenName:   'Baba',
  familyName:  'John',
};

const mockEncounter = {
  id:            'encounter-uuid-1',
  patientId:     'patient-uuid-1',
  type:          'OUTPATIENT',
  encounterDate: new Date('2026-06-01'),
  clinicianName: 'Dr. Aitanun',
  location:      'Cardiology',
  notes:         null,
  openmrsUuid:   'omrs-encounter-uuid-1',
  syncStatus:    'SYNCED',
  createdAt:     new Date(),
  updatedAt:     new Date(),
  patient:       mockPatient,
};

describe('EncounterService', () => {
  let service: EncounterService;

  beforeEach(() => {
    service = new EncounterService();
    jest.clearAllMocks();
  });

  describe('createEncounter', () => {
    const input = {
      patientId:     'patient-uuid-1',
      type:          'OUTPATIENT' as const,
      encounterDate: '2026-06-01',
      clinicianName: 'Dr. Aitanun',
      location:      'Cardiology',
    };

    it('creates encounter and syncs to OpenMRS when patient exists', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient);
      (openmrsClient.post as jest.Mock).mockResolvedValue({ uuid: 'omrs-encounter-uuid-1' });
      (prisma.encounter.create as jest.Mock).mockResolvedValue(mockEncounter);

      const result = await service.createEncounter(input);

      expect(prisma.patient.findUnique).toHaveBeenCalledWith({ where: { id: input.patientId } });
      expect(openmrsClient.post).toHaveBeenCalledWith('/encounter', expect.objectContaining({
        patient: mockPatient.openmrsUuid,
      }));
      expect(prisma.encounter.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          patientId:     input.patientId,
          type:          input.type,
          clinicianName: input.clinicianName,
          openmrsUuid:   'omrs-encounter-uuid-1',
          syncStatus:    'SYNCED',
        }),
      }));
      expect(result).toEqual(mockEncounter);
    });

    it('saves locally with FAILED syncStatus when OpenMRS is unreachable', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient);
      (openmrsClient.post as jest.Mock).mockRejectedValue(new Error('OpenMRS timeout'));
      (prisma.encounter.create as jest.Mock).mockResolvedValue({
        ...mockEncounter,
        openmrsUuid: null,
        syncStatus:  'FAILED',
      });

      const result = await service.createEncounter(input);

      expect(prisma.encounter.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          openmrsUuid: null,
          syncStatus:  'FAILED',
        }),
      }));
      expect(result.syncStatus).toBe('FAILED');
    });

    it('throws NotFoundError when patient does not exist', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createEncounter(input)).rejects.toThrow(NotFoundError);
      expect(openmrsClient.post).not.toHaveBeenCalled();
      expect(prisma.encounter.create).not.toHaveBeenCalled();
    });
  });

  describe('listEncounters', () => {
    it('returns paginated encounters', async () => {
      (prisma.encounter.findMany as jest.Mock).mockResolvedValue([mockEncounter]);
      (prisma.encounter.count as jest.Mock).mockResolvedValue(1);

      const result = await service.listEncounters({ page: 1, limit: 10 });

      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('filters by patientId when provided', async () => {
      (prisma.encounter.findMany as jest.Mock).mockResolvedValue([mockEncounter]);
      (prisma.encounter.count as jest.Mock).mockResolvedValue(1);

      await service.listEncounters({ patientId: 'patient-uuid-1' });

      expect(prisma.encounter.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { patientId: 'patient-uuid-1' },
      }));
    });

    it('filters by type when provided', async () => {
      (prisma.encounter.findMany as jest.Mock).mockResolvedValue([mockEncounter]);
      (prisma.encounter.count as jest.Mock).mockResolvedValue(1);

      await service.listEncounters({ type: 'OUTPATIENT' });

      expect(prisma.encounter.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { type: 'OUTPATIENT' },
      }));
    });
  });

  describe('getEncounterById', () => {
    it('returns encounter when found', async () => {
      (prisma.encounter.findUnique as jest.Mock).mockResolvedValue(mockEncounter);

      const result = await service.getEncounterById('encounter-uuid-1');

      expect(prisma.encounter.findUnique).toHaveBeenCalledWith({
        where:   { id: 'encounter-uuid-1' },
        include: { patient: true, prescriptions: true, observations: true },
      });
      expect(result).toEqual(mockEncounter);
    });

    it('throws NotFoundError when encounter does not exist', async () => {
      (prisma.encounter.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getEncounterById('bad-uuid')).rejects.toThrow(NotFoundError);
    });
  });
});
