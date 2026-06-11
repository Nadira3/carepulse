import { PrescriptionService } from './prescription.service';
import { prisma } from '../../config/prisma';
import { openmrsClient } from '../../config/openmrs-client';
import { NotFoundError } from '../../common/errors/app-errors';

jest.mock('../../config/prisma', () => ({
  prisma: {
    patient:          { findUnique: jest.fn() },
    encounter:        { findUnique: jest.fn() },
    prescription:     {
      create:         jest.fn(),
      findMany:       jest.fn(),
      findUnique:     jest.fn(),
      count:          jest.fn(),
      update:         jest.fn(),
    },
    reminderSchedule: {
      createMany:     jest.fn(),
      updateMany:     jest.fn(),
    },
  },
}));

jest.mock('../../config/openmrs-client', () => ({
  openmrsClient: { post: jest.fn() },
}));

const mockPatient = {
  id:          'patient-uuid-1',
  openmrsUuid: 'omrs-patient-uuid-1',
};

const mockEncounter = {
  id:          'encounter-uuid-1',
  patientId:   'patient-uuid-1',
  openmrsUuid: 'omrs-encounter-uuid-1',
};

const mockPrescription = {
  id:              'prescription-uuid-1',
  patientId:       'patient-uuid-1',
  encounterId:     'encounter-uuid-1',
  drugName:        'Amlodipine',
  dose:            '5mg',
  frequency:       'Once daily',
  frequencyHours:  24,
  doseTimes:       ['08:00'],
  duration:        '30 days',
  instructions:    'Take with water',
  startDate:       new Date('2026-06-01'),
  endDate:         new Date('2026-07-01'),
  active:          true,
  openmrsOrderUuid:'omrs-obs-uuid-1',
  syncStatus:      'SYNCED',
  createdAt:       new Date(),
  updatedAt:       new Date(),
  patient:         mockPatient,
  encounter:       mockEncounter,
};

const validInput = {
  patientId:      'patient-uuid-1',
  encounterId:    'encounter-uuid-1',
  drugName:       'Amlodipine',
  dose:           '5mg',
  frequency:      'Once daily',
  frequencyHours: 24,
  doseTimes:      ['08:00'],
  duration:       '30 days',
  instructions:   'Take with water',
  startDate:      '2026-06-01',
  endDate:        '2026-07-01',
};

describe('PrescriptionService', () => {
  let service: PrescriptionService;

  beforeEach(() => {
    service = new PrescriptionService();
    jest.clearAllMocks();
  });

  describe('createPrescription', () => {
    it('creates prescription and syncs to OpenMRS as obs when patient and encounter exist', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient);
      (prisma.encounter.findUnique as jest.Mock).mockResolvedValue(mockEncounter);
      (openmrsClient.post as jest.Mock).mockResolvedValue({ uuid: 'omrs-obs-uuid-1' });
      (prisma.prescription.create as jest.Mock).mockResolvedValue(mockPrescription);
      (prisma.reminderSchedule.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.createPrescription(validInput);

      expect(prisma.patient.findUnique).toHaveBeenCalledWith({ where: { id: validInput.patientId } });
      expect(prisma.encounter.findUnique).toHaveBeenCalledWith({ where: { id: validInput.encounterId } });

      // Syncs as /obs not /order
      expect(openmrsClient.post).toHaveBeenCalledWith('/obs', expect.objectContaining({
        person:    mockPatient.openmrsUuid,
        encounter: mockEncounter.openmrsUuid,
        value:     expect.stringContaining('Amlodipine'),
      }));

      expect(prisma.prescription.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          syncStatus:       'SYNCED',
          openmrsOrderUuid: 'omrs-obs-uuid-1',
        }),
      }));
      expect(prisma.reminderSchedule.createMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ doseTime: '08:00', frequencyHours: 24 }),
        ]),
      }));
      expect(result).toEqual(mockPrescription);
    });

    it('saves locally with FAILED syncStatus when OpenMRS is unreachable', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient);
      (prisma.encounter.findUnique as jest.Mock).mockResolvedValue(mockEncounter);
      (openmrsClient.post as jest.Mock).mockRejectedValue(new Error('timeout'));
      (prisma.prescription.create as jest.Mock).mockResolvedValue({
        ...mockPrescription,
        openmrsOrderUuid: null,
        syncStatus:       'FAILED',
      });
      (prisma.reminderSchedule.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.createPrescription(validInput);

      expect(prisma.prescription.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          openmrsOrderUuid: null,
          syncStatus:       'FAILED',
        }),
      }));
      expect(result.syncStatus).toBe('FAILED');
    });

    it('throws NotFoundError when patient does not exist', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.createPrescription(validInput)).rejects.toThrow(NotFoundError);
      expect(prisma.encounter.findUnique).not.toHaveBeenCalled();
      expect(prisma.prescription.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when encounter does not exist', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient);
      (prisma.encounter.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.createPrescription(validInput)).rejects.toThrow(NotFoundError);
      expect(prisma.prescription.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when encounter belongs to a different patient', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient);
      (prisma.encounter.findUnique as jest.Mock).mockResolvedValue({
        ...mockEncounter,
        patientId: 'different-patient-uuid',
      });
      await expect(service.createPrescription(validInput)).rejects.toThrow(NotFoundError);
      expect(prisma.prescription.create).not.toHaveBeenCalled();
    });
  });

  describe('listPrescriptions', () => {
    it('returns paginated prescriptions', async () => {
      (prisma.prescription.findMany as jest.Mock).mockResolvedValue([mockPrescription]);
      (prisma.prescription.count as jest.Mock).mockResolvedValue(1);
      const result = await service.listPrescriptions({ page: 1, limit: 10 });
      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('filters by patientId when provided', async () => {
      (prisma.prescription.findMany as jest.Mock).mockResolvedValue([mockPrescription]);
      (prisma.prescription.count as jest.Mock).mockResolvedValue(1);
      await service.listPrescriptions({ patientId: 'patient-uuid-1' });
      expect(prisma.prescription.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { patientId: 'patient-uuid-1' },
      }));
    });

    it('filters by active status when provided', async () => {
      (prisma.prescription.findMany as jest.Mock).mockResolvedValue([mockPrescription]);
      (prisma.prescription.count as jest.Mock).mockResolvedValue(1);
      await service.listPrescriptions({ active: true });
      expect(prisma.prescription.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { active: true },
      }));
    });
  });

  describe('getPrescriptionById', () => {
    it('returns prescription when found', async () => {
      (prisma.prescription.findUnique as jest.Mock).mockResolvedValue(mockPrescription);
      const result = await service.getPrescriptionById('prescription-uuid-1');
      expect(prisma.prescription.findUnique).toHaveBeenCalledWith({
        where:   { id: 'prescription-uuid-1' },
        include: { patient: true, encounter: true, reminders: true, reminderSchedules: true },
      });
      expect(result).toEqual(mockPrescription);
    });

    it('throws NotFoundError when prescription does not exist', async () => {
      (prisma.prescription.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getPrescriptionById('bad-uuid')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateStatus', () => {
    it('deactivates a prescription', async () => {
      (prisma.prescription.findUnique as jest.Mock).mockResolvedValue(mockPrescription);
      (prisma.prescription.update as jest.Mock).mockResolvedValue({
        ...mockPrescription, active: false,
      });
      (prisma.reminderSchedule.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      const result = await service.updateStatus('prescription-uuid-1', { active: false });
      expect(prisma.prescription.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'prescription-uuid-1' },
        data:  { active: false },
      }));
      expect(result.active).toBe(false);
    });

    it('throws NotFoundError when prescription does not exist', async () => {
      (prisma.prescription.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.updateStatus('bad-uuid', { active: false })).rejects.toThrow(NotFoundError);
      expect(prisma.prescription.update).not.toHaveBeenCalled();
    });
  });
});
