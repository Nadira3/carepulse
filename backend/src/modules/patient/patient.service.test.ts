import { PatientService } from './patient.service';
import { openmrsClient } from '../../config/openmrs-client';

jest.mock('../../config/openmrs-client', () => ({
  openmrsClient: {
    get:  jest.fn(),
    post: jest.fn(),
  },
}));

const mockPatient = {
  uuid:        'omrs-uuid-123',
  display:     'Baba John',
  identifiers: [],
  person:      { gender: 'M', age: 61, display: 'Baba John' },
};

describe('PatientService', () => {
  let service: PatientService;

  beforeEach(() => {
    service = new PatientService();
    jest.clearAllMocks();
  });

  describe('searchPatients', () => {
    it('should return list of patients for valid query', async () => {
      (openmrsClient.get as jest.Mock).mockResolvedValue({ results: [mockPatient] });
      const result = await service.searchPatients('Baba');
      expect(result).toEqual([mockPatient]);
      expect(openmrsClient.get).toHaveBeenCalledWith('/patient', { q: 'Baba', v: 'default' });
    });

    it('should throw error if query is less than 2 characters', async () => {
      await expect(service.searchPatients('B')).rejects.toThrow('at least 2 characters');
    });

    it('should throw error if query is empty', async () => {
      await expect(service.searchPatients('')).rejects.toThrow('at least 2 characters');
    });

    it('should return empty array when no patients found', async () => {
      (openmrsClient.get as jest.Mock).mockResolvedValue({ results: [] });
      const result = await service.searchPatients('Unknown');
      expect(result).toEqual([]);
    });
  });

  describe('getPatientByUuid', () => {
    it('should return patient for valid UUID', async () => {
      (openmrsClient.get as jest.Mock).mockResolvedValue(mockPatient);
      const result = await service.getPatientByUuid('omrs-uuid-123');
      expect(result).toEqual(mockPatient);
    });

    it('should throw error if UUID is empty', async () => {
      await expect(service.getPatientByUuid('')).rejects.toThrow('UUID is required');
    });
  });

  describe('createPatient', () => {
    it('should generate an OpenMRS ID then create patient with two identifiers', async () => {
      // First call: idgen; second call: patient create
      (openmrsClient.post as jest.Mock)
        .mockResolvedValueOnce({ identifier: '10001U7' })
        .mockResolvedValueOnce(mockPatient);

      const result = await service.createPatient({
        givenName:  'Baba',
        familyName: 'John',
        gender:     'M',
        age:        61,
        identifier: 'ISTH-BJ-001',
      });

      expect(openmrsClient.post).toHaveBeenCalledTimes(2);

      // First call must be idgen
      expect((openmrsClient.post as jest.Mock).mock.calls[0][0]).toContain('identifiersource');

      // Second call must be patient create with both identifiers
      expect((openmrsClient.post as jest.Mock).mock.calls[1][0]).toBe('/patient');
      expect((openmrsClient.post as jest.Mock).mock.calls[1][1]).toMatchObject({
        identifiers: expect.arrayContaining([
          expect.objectContaining({ identifier: '10001U7' }),
          expect.objectContaining({ identifier: 'ISTH-BJ-001' }),
        ]),
        person: expect.objectContaining({
          gender: 'M',
          names: [expect.objectContaining({ givenName: 'Baba', familyName: 'John' })],
        }),
      });

      expect(result).toEqual(mockPatient);
    });
  });
});
