import { AdherenceService } from './adherence.service';
import { prisma } from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
  prisma: {
    reminder:         { findMany: jest.fn(), update: jest.fn() },
    adherenceRecord:  { findFirst: jest.fn(), upsert: jest.fn() },
  },
}));

const patientId = 'patient-uuid-1';

const makeReminder = (overrides = {}) => ({
  id:          'reminder-uuid-1',
  patientId,
  type:        'MEDICATION',
  status:      'SENT',
  confirmedAt: null,
  failedAt:    null,
  scheduledAt: new Date(),
  ...overrides,
});

describe('AdherenceService', () => {
  let service: AdherenceService;

  beforeEach(() => {
    service = new AdherenceService();
    jest.clearAllMocks();
  });

  describe('calculateAndStore', () => {
    it('returns 100 when all medication reminders confirmed', async () => {
      (prisma.reminder.findMany as jest.Mock)
        .mockResolvedValueOnce([
          makeReminder({ confirmedAt: new Date() }),
          makeReminder({ confirmedAt: new Date() }),
        ])
        .mockResolvedValueOnce([]); // no appointment reminders

      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adherenceRecord.upsert as jest.Mock).mockResolvedValue({});

      const score = await service.calculateAndStore(patientId);
      expect(score).toBe(100);
    });

    it('returns 0 when no reminders confirmed', async () => {
      (prisma.reminder.findMany as jest.Mock)
        .mockResolvedValueOnce([
          makeReminder({ confirmedAt: null }),
          makeReminder({ confirmedAt: null }),
        ])
        .mockResolvedValueOnce([]);

      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adherenceRecord.upsert as jest.Mock).mockResolvedValue({});

      const score = await service.calculateAndStore(patientId);
      expect(score).toBe(0);
    });

    it('calculates weighted score — 70% medication 30% appointment', async () => {
      // 1 of 2 medication confirmed = 50% med score
      (prisma.reminder.findMany as jest.Mock)
        .mockResolvedValueOnce([
          makeReminder({ confirmedAt: new Date() }),
          makeReminder({ confirmedAt: null }),
        ])
        // 2 of 2 appointments attended = 100% appt score
        .mockResolvedValueOnce([
          makeReminder({ type: 'APPOINTMENT', confirmedAt: new Date() }),
          makeReminder({ type: 'APPOINTMENT', confirmedAt: new Date() }),
        ]);

      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adherenceRecord.upsert as jest.Mock).mockResolvedValue({});

      const score = await service.calculateAndStore(patientId);
      // (50 * 0.7) + (100 * 0.3) = 35 + 30 = 65
      expect(score).toBe(65);
    });

    it('returns 100 when no reminders exist yet', async () => {
      (prisma.reminder.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adherenceRecord.upsert as jest.Mock).mockResolvedValue({});

      const score = await service.calculateAndStore(patientId);
      expect(score).toBe(0);
    });

    it('persists the calculated score via upsert', async () => {
      (prisma.reminder.findMany as jest.Mock)
        .mockResolvedValueOnce([makeReminder({ confirmedAt: new Date() })])
        .mockResolvedValueOnce([]);

      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adherenceRecord.upsert as jest.Mock).mockResolvedValue({});

      await service.calculateAndStore(patientId);

      expect(prisma.adherenceRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            patientId,
            adherenceScore: 100,
          }),
        })
      );
    });
  });

  describe('getLatestScore', () => {
    it('returns score from most recent adherence record', async () => {
      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue({
        adherenceScore: 72.5,
      });

      const score = await service.getLatestScore(patientId);
      expect(score).toBe(72.5);
    });

    it('returns 0 when no record exists', async () => {
      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const score = await service.getLatestScore(patientId);
      expect(score).toBe(0);
    });
  });

  describe('needsLifestyleTip', () => {
    it('returns true when score is below threshold', async () => {
      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue({
        adherenceScore: 40,
      });

      const result = await service.needsLifestyleTip(patientId);
      expect(result).toBe(true);
    });

    it('returns false when score is above threshold', async () => {
      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue({
        adherenceScore: 75,
      });

      const result = await service.needsLifestyleTip(patientId);
      expect(result).toBe(false);
    });

    it('returns true when no record exists (score defaults to 0)', async () => {
      (prisma.adherenceRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.needsLifestyleTip(patientId);
      expect(result).toBe(true);
    });
  });
});
