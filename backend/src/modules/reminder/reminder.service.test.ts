import { ReminderService } from './reminder.service';
import { prisma } from '../../config/prisma';
import { generateReminderMessage } from '../../common/utils/gemini.client';
import { sendSMS } from '../../common/utils/africastalking.client';
import { adherenceService } from '../adherence/adherence.service';

jest.mock('../../config/prisma', () => ({
  prisma: {
    prescription: { findMany: jest.fn() },
    reminder:     {
      findFirst:  jest.fn(),
      findMany:   jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
    },
    patient:      { findFirst: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('../../common/utils/gemini.client', () => ({
  generateReminderMessage: jest.fn(),
}));

jest.mock('../../common/utils/africastalking.client', () => ({
  sendSMS: jest.fn(),
}));

jest.mock('../adherence/adherence.service', () => ({
  adherenceService: {
    calculateAndStore: jest.fn(),
    needsLifestyleTip: jest.fn(),
  },
}));

const mockPatient = {
  id:                'patient-uuid-1',
  givenName:         'Baba',
  familyName:        'John',
  phone:             '+2348105443549',
  preferredLanguage: 'Pidgin English',
  primaryDiagnosis:  'Hypertension',
  consentGiven:      true,
};

const mockPrescription = {
  id:             'prescription-uuid-1',
  patientId:      'patient-uuid-1',
  drugName:       'Amlodipine',
  dose:           '5mg',
  frequency:      'Once daily',
  frequencyHours: 24,
  doseTimes:      ['08:00'],
  active:         true,
  patient:        mockPatient,
};

const mockReminder = {
  id:          'reminder-uuid-1',
  patientId:   'patient-uuid-1',
  type:        'MEDICATION',
  status:      'PENDING',
  message:     'Hi Baba, take your Amlodipine.',
  scheduledAt: new Date(),
  sentAt:      null,
  confirmedAt: null,
  failedAt:    null,
  patient:     mockPatient,
};

describe('ReminderService', () => {
  let service: ReminderService;

  beforeEach(() => {
    service = new ReminderService();
    jest.clearAllMocks();
  });

  describe('scheduleMedicationReminders', () => {
    it('creates a reminder for active prescription with no reminder today', async () => {
      (prisma.prescription.findMany as jest.Mock).mockResolvedValue([mockPrescription]);
      (prisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);
      (generateReminderMessage as jest.Mock).mockResolvedValue('Hi Baba, take your Amlodipine.');
      (prisma.reminder.create as jest.Mock).mockResolvedValue(mockReminder);

      await service.scheduleMedicationReminders();

      expect(generateReminderMessage).toHaveBeenCalledWith(expect.objectContaining({
        patientName:  'Baba',
        drugName:     'Amlodipine',
        reminderType: 'MEDICATION',
      }));
      expect(prisma.reminder.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          patientId:      'patient-uuid-1',
          prescriptionId: 'prescription-uuid-1',
          type:           'MEDICATION',
          status:         'PENDING',
        }),
      }));
    });

    it('skips patient with no phone number', async () => {
      (prisma.prescription.findMany as jest.Mock).mockResolvedValue([{
        ...mockPrescription,
        patient: { ...mockPatient, phone: null },
      }]);

      await service.scheduleMedicationReminders();

      expect(generateReminderMessage).not.toHaveBeenCalled();
      expect(prisma.reminder.create).not.toHaveBeenCalled();
    });

    it('skips prescription that already has a reminder today', async () => {
      (prisma.prescription.findMany as jest.Mock).mockResolvedValue([mockPrescription]);
      (prisma.reminder.findFirst as jest.Mock).mockResolvedValue(mockReminder);

      await service.scheduleMedicationReminders();

      expect(prisma.reminder.create).not.toHaveBeenCalled();
    });

    it('uses fallback message when Gemini fails', async () => {
      (prisma.prescription.findMany as jest.Mock).mockResolvedValue([mockPrescription]);
      (prisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);
      (generateReminderMessage as jest.Mock).mockRejectedValue(new Error('Gemini quota exceeded'));
      (prisma.reminder.create as jest.Mock).mockResolvedValue(mockReminder);

      await service.scheduleMedicationReminders();

      expect(prisma.reminder.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          message: expect.stringContaining('Amlodipine'),
        }),
      }));
    });
  });

  describe('sendPendingReminders', () => {
    it('sends SMS and marks reminder as SENT on success', async () => {
      (prisma.reminder.findMany as jest.Mock).mockResolvedValue([mockReminder]);
      (sendSMS as jest.Mock).mockResolvedValue({ success: true, messageId: 'msg-123' });
      (prisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.sendPendingReminders();

      expect(sendSMS).toHaveBeenCalledWith(mockPatient.phone, mockReminder.message);
      expect(prisma.reminder.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockReminder.id },
        data:  expect.objectContaining({ status: 'SENT' }),
      }));
    });

    it('marks reminder as FAILED when SMS fails', async () => {
      (prisma.reminder.findMany as jest.Mock).mockResolvedValue([mockReminder]);
      (sendSMS as jest.Mock).mockResolvedValue({ success: false, error: 'Network error' });
      (prisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.sendPendingReminders();

      expect(prisma.reminder.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      }));
    });

    it('marks reminder as FAILED when patient has no phone', async () => {
      (prisma.reminder.findMany as jest.Mock).mockResolvedValue([{
        ...mockReminder,
        patient: { ...mockPatient, phone: null },
      }]);
      (prisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.sendPendingReminders();

      expect(sendSMS).not.toHaveBeenCalled();
      expect(prisma.reminder.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      }));
    });
  });

  describe('markTimedOutReminders', () => {
    it('marks SENT reminders as FAILED after timeout and recalculates adherence', async () => {
      const sentAt = new Date();
      sentAt.setHours(sentAt.getHours() - 5);

      (prisma.reminder.findMany as jest.Mock).mockResolvedValue([{
        ...mockReminder,
        status: 'SENT',
        sentAt,
      }]);
      (prisma.reminder.update as jest.Mock).mockResolvedValue({});
      (adherenceService.calculateAndStore as jest.Mock).mockResolvedValue(45);

      await service.markTimedOutReminders();

      expect(prisma.reminder.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      }));
      expect(adherenceService.calculateAndStore).toHaveBeenCalledWith('patient-uuid-1');
    });
  });

  describe('handleReply', () => {
    it('marks reminder as confirmed when patient replies CONFIRM', async () => {
      (prisma.patient.findFirst as jest.Mock).mockResolvedValue(mockPatient);
      (prisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        ...mockReminder,
        status: 'SENT',
      });
      (prisma.reminder.update as jest.Mock).mockResolvedValue({});
      (adherenceService.calculateAndStore as jest.Mock).mockResolvedValue(85);

      await service.handleReply('+2348105443549', 'CONFIRM');

      expect(prisma.reminder.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          confirmedAt: expect.any(Date),
        }),
      }));
      expect(adherenceService.calculateAndStore).toHaveBeenCalledWith('patient-uuid-1');
    });

    it('reschedules reminder for 1 hour when patient replies SNOOZE', async () => {
      (prisma.patient.findFirst as jest.Mock).mockResolvedValue(mockPatient);
      (prisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        ...mockReminder,
        status: 'SENT',
      });
      (prisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.handleReply('+2348105443549', 'SNOOZE');

      expect(prisma.reminder.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status:      'PENDING',
          scheduledAt: expect.any(Date),
        }),
      }));
    });

    it('does nothing for unknown phone number', async () => {
      (prisma.patient.findFirst as jest.Mock).mockResolvedValue(null);

      await service.handleReply('+2340000000000', 'CONFIRM');

      expect(prisma.reminder.update).not.toHaveBeenCalled();
    });

    it('handles case-insensitive replies', async () => {
      (prisma.patient.findFirst as jest.Mock).mockResolvedValue(mockPatient);
      (prisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        ...mockReminder,
        status: 'SENT',
      });
      (prisma.reminder.update as jest.Mock).mockResolvedValue({});
      (adherenceService.calculateAndStore as jest.Mock).mockResolvedValue(85);

      await service.handleReply('+2348105443549', 'confirm');

      expect(prisma.reminder.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ confirmedAt: expect.any(Date) }),
      }));
    });
  });

  describe('sendLifestyleTips', () => {
    it('sends lifestyle tip to patient with low adherence', async () => {
      (prisma.patient.findMany as jest.Mock).mockResolvedValue([mockPatient]);
      (adherenceService.needsLifestyleTip as jest.Mock).mockResolvedValue(true);
      (prisma.reminder.findFirst as jest.Mock).mockResolvedValue(null);
      (generateReminderMessage as jest.Mock).mockResolvedValue('Baba, reduce your salt intake today.');
      (prisma.reminder.create as jest.Mock).mockResolvedValue({
        ...mockReminder,
        type: 'LIFESTYLE',
      });
      (sendSMS as jest.Mock).mockResolvedValue({ success: true, messageId: 'msg-456' });
      (prisma.reminder.update as jest.Mock).mockResolvedValue({});

      await service.sendLifestyleTips();

      expect(generateReminderMessage).toHaveBeenCalledWith(expect.objectContaining({
        reminderType: 'LIFESTYLE',
        patientName:  'Baba',
      }));
      expect(sendSMS).toHaveBeenCalledWith(
        mockPatient.phone,
        'Baba, reduce your salt intake today.'
      );
    });

    it('skips patient with good adherence', async () => {
      (prisma.patient.findMany as jest.Mock).mockResolvedValue([mockPatient]);
      (adherenceService.needsLifestyleTip as jest.Mock).mockResolvedValue(false);

      await service.sendLifestyleTips();

      expect(generateReminderMessage).not.toHaveBeenCalled();
      expect(sendSMS).not.toHaveBeenCalled();
    });

    it('skips patient who received a tip this week', async () => {
      (prisma.patient.findMany as jest.Mock).mockResolvedValue([mockPatient]);
      (adherenceService.needsLifestyleTip as jest.Mock).mockResolvedValue(true);
      (prisma.reminder.findFirst as jest.Mock).mockResolvedValue({
        ...mockReminder,
        type: 'LIFESTYLE',
      });

      await service.sendLifestyleTips();

      expect(generateReminderMessage).not.toHaveBeenCalled();
    });
  });
});
