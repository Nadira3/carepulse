import request from 'supertest';
import app from '../../app';
import { patientService } from './patient.service';
import { prisma } from '../../config/prisma';
import { authService } from '../auth/auth.service';

jest.mock('./patient.service');
jest.mock('../auth/auth.service');
jest.mock('../../config/prisma', () => ({
  prisma: {
    patient: {
      findUnique: jest.fn(),
      findMany:   jest.fn(),
      create:     jest.fn(),
      count:      jest.fn(),
    },
  },
}));

const VALID_UUID  = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5';
const MOCK_TOKEN  = 'Bearer mock-valid-token';
const MOCK_JWT    = { sub: VALID_UUID, email: 'doctor@hospital.com', role: 'CLINICIAN' };

const mockOmrsPatient = {
  uuid: VALID_UUID,
  display: 'John TestPatient',
  identifiers: [{ identifier: 'PAT-001', preferred: true }],
  person: {
    uuid: 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6',
    display: 'John TestPatient',
    gender: 'M', age: 35,
    birthdate: '1990-01-01T00:00:00.000+0000',
    names: [{ givenName: 'John', familyName: 'TestPatient', preferred: true }],
  },
};

const mockDbPatient = {
  id:                 'c3d4e5f6-a7b8-4c9d-0e1f-a2b3c4d5e6f7',
  openmrsUuid:        VALID_UUID,
  identifier:         'PAT-001',
  givenName:          'John',
  familyName:         'TestPatient',
  gender:             'M',
  age:                35,
  phone:              '+2348012345678',
  occupation:         'Teacher',
  preferredLanguage:  'English',
  primaryDiagnosis:   'Hypertension',
  secondaryCondition: null,
  clinicianName:      'Dr. Smith',
  ward:               'Cardiology',
  enrolmentDate:      new Date('2026-01-01'),
  consentGiven:       true,
  birthdate:          null,
  createdAt:          new Date('2026-01-01'),
  updatedAt:          new Date('2026-01-01'),
};

const validPayload = {
  givenName:        'John',
  familyName:       'TestPatient',
  gender:           'M',
  age:              35,
  phone:            '+2348012345678',
  occupation:       'Teacher',
  preferredLanguage:'English',
  primaryDiagnosis: 'Hypertension',
  clinicianName:    'Dr. Smith',
  ward:             'Cardiology',
  identifier:       'PAT-001',
  enrolmentDate:    '2026-01-01',
  consentGiven:     true,
};

describe('Patient Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.verifyAccessToken as jest.Mock).mockReturnValue(MOCK_JWT);
  });

  describe('GET /api/patients', () => {
    it('should return paginated patient list', async () => {
      (prisma.patient.findMany as jest.Mock).mockResolvedValueOnce([mockDbPatient]);
      (prisma.patient.count as jest.Mock).mockResolvedValueOnce(1);

      const res = await request(app)
        .get('/api/patients')
        .set('Authorization', MOCK_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).get('/api/patients');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/patients filters', () => {
    it('should filter by search term', async () => {
      (prisma.patient.findMany as jest.Mock).mockResolvedValueOnce([mockDbPatient]);
      (prisma.patient.count as jest.Mock).mockResolvedValueOnce(1);

      const res = await request(app)
        .get('/api/patients?search=Baba')
        .set('Authorization', MOCK_TOKEN);

      expect(res.status).toBe(200);
      expect(prisma.patient.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ givenName: expect.objectContaining({ contains: 'Baba' }) }),
          ]),
        }),
      }));
    });

    it('should filter by disease', async () => {
      (prisma.patient.findMany as jest.Mock).mockResolvedValueOnce([mockDbPatient]);
      (prisma.patient.count as jest.Mock).mockResolvedValueOnce(1);

      const res = await request(app)
        .get('/api/patients?disease=Hypertension')
        .set('Authorization', MOCK_TOKEN);

      expect(res.status).toBe(200);
      expect(prisma.patient.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          primaryDiagnosis: expect.objectContaining({ contains: 'Hypertension' }),
        }),
      }));
    });

    it('should return empty results when no patients match filter', async () => {
      (prisma.patient.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.patient.count as jest.Mock).mockResolvedValueOnce(0);

      const res = await request(app)
        .get('/api/patients?search=NonExistentPatient')
        .set('Authorization', MOCK_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  describe('GET /api/patients/search', () => {
    it('should return 200 with results for valid query', async () => {
      (patientService.searchPatients as jest.Mock).mockResolvedValueOnce([mockOmrsPatient]);

      const res = await request(app)
        .get('/api/patients/search?q=John')
        .set('Authorization', MOCK_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(1);
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).get('/api/patients/search?q=John');
      expect(res.status).toBe(401);
    });

    it('should return 400 if q missing', async () => {
      const res = await request(app)
        .get('/api/patients/search')
        .set('Authorization', MOCK_TOKEN);
      expect(res.status).toBe(400);
    });

    it('should return 400 if q too short', async () => {
      const res = await request(app)
        .get('/api/patients/search?q=J')
        .set('Authorization', MOCK_TOKEN);
      expect(res.status).toBe(400);
    });

    it('should return 200 with empty results', async () => {
      (patientService.searchPatients as jest.Mock).mockResolvedValueOnce([]);
      const res = await request(app)
        .get('/api/patients/search?q=Nobody')
        .set('Authorization', MOCK_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });

  describe('GET /api/patients/:uuid', () => {
    it('should return 200 for valid UUID', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValueOnce(mockDbPatient);
      const res = await request(app)
        .get(`/api/patients/${VALID_UUID}`)
        .set('Authorization', MOCK_TOKEN);
      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(app)
        .get('/api/patients/bad-uuid')
        .set('Authorization', MOCK_TOKEN);
      expect(res.status).toBe(400);
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).get(`/api/patients/${VALID_UUID}`);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/patients', () => {
    it('should return 201 on success', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (patientService.createPatient as jest.Mock).mockResolvedValueOnce(mockOmrsPatient);
      (prisma.patient.create as jest.Mock).mockResolvedValueOnce(mockDbPatient);

      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', MOCK_TOKEN)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.identifier).toBe('PAT-001');
    });

    it('should return 409 for duplicate identifier', async () => {
      (prisma.patient.findUnique as jest.Mock).mockResolvedValueOnce(mockDbPatient);
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', MOCK_TOKEN)
        .send(validPayload);
      expect(res.status).toBe(409);
    });

    it('should return 400 if occupation missing', async () => {
      const { occupation, ...without } = validPayload;
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', MOCK_TOKEN)
        .send(without);
      expect(res.status).toBe(400);
    });

    it('should return 400 if phone missing', async () => {
      const { phone, ...without } = validPayload;
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', MOCK_TOKEN)
        .send(without);
      expect(res.status).toBe(400);
    });

    it('should return 400 if consent not given', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', MOCK_TOKEN)
        .send({ ...validPayload, consentGiven: false });
      expect(res.status).toBe(400);
    });

    it('should return 400 if gender invalid', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', MOCK_TOKEN)
        .send({ ...validPayload, gender: 'Male' });
      expect(res.status).toBe(400);
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).post('/api/patients').send(validPayload);
      expect(res.status).toBe(401);
    });
  });
});
