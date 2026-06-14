import { Request, Response, NextFunction } from 'express';
import { patientService } from './patient.service';
import { prisma } from '../../config/prisma';
import {
  searchQuerySchema,
  getPatientByUuidSchema,
  getPatientByIdSchema,
  createPatientSchema,
  updatePatientSchema,
  updateAppointmentSchema,
} from './patient.validation';
import { ConflictError, NotFoundError } from '../../common/errors/app-errors';

export class PatientController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = searchQuerySchema.parse(req.query);
      const patients = await patientService.searchPatients(q);
      res.status(200).json({ results: patients, count: patients.length });
    } catch (err) {
      next(err);
    }
  }

  async getByUuid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uuid } = getPatientByUuidSchema.parse(req.params);
      const patient  = await patientService.getPatientByUuid(uuid);
      res.status(200).json(patient);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = getPatientByIdSchema.parse(req.params);
      const patient = await prisma.patient.findUnique({
        where:   { id },
        include: {
          prescriptions: {
            where:   { active: true },
            include: { reminderSchedules: true },
          },
        },
      });
      if (!patient) throw new NotFoundError('Patient', id);
      res.status(200).json(patient);
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page    = parseInt(req.query.page  as string) || 1;
      const limit   = parseInt(req.query.limit as string) || 10;
      const skip    = (page - 1) * limit;
      const search  = (req.query.search  as string | undefined)?.trim();
      const disease = (req.query.disease as string | undefined)?.trim();

      const where: any = {};

      if (search) {
        where.OR = [
          { givenName:  { contains: search, mode: 'insensitive' } },
          { familyName: { contains: search, mode: 'insensitive' } },
          { identifier: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (disease) {
        where.primaryDiagnosis = { contains: disease, mode: 'insensitive' };
      }

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.patient.count({ where }),
      ]);

      res.status(200).json({
        results: patients,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const totalPatients = await prisma.patient.count();

      const records = await prisma.adherenceRecord.findMany({
        distinct:  ['patientId'],
        orderBy:   { createdAt: 'desc' },
        select:    { adherenceScore: true },
      });

      let green = 0, amber = 0, red = 0;
      records.forEach(r => {
        if (r.adherenceScore >= 80)      green++;
        else if (r.adherenceScore >= 50) amber++;
        else                             red++;
      });

      const untracked = totalPatients - records.length;

      res.status(200).json({
        totalPatients,
        adherence: {
          green,
          amber,
          red,
          untracked,
          // Rate only counts tracked patients — untracked excluded from %
          rate: records.length
            ? Math.round((green / records.length) * 100)
            : null,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createPatientSchema.parse(req.body);

      const existing = await prisma.patient.findUnique({
        where: { identifier: input.identifier },
      });
      if (existing) {
        throw new ConflictError(
          `Patient with identifier '${input.identifier}' already exists`
        );
      }

      const omrsPatient = await patientService.createPatient({
        givenName:  input.givenName,
        familyName: input.familyName,
        gender:     input.gender,
        age:        input.age,
        birthdate:  input.birthdate,
        identifier: input.identifier,
      });

      const saved = await prisma.patient.create({
        data: {
          openmrsUuid:        omrsPatient.uuid,
          identifier:         input.identifier,
          givenName:          input.givenName,
          familyName:         input.familyName,
          gender:             input.gender,
          age:                input.age,
          birthdate:          input.birthdate ? new Date(input.birthdate) : null,
          phone:              input.phone,
          occupation:         input.occupation,
          preferredLanguage:  input.preferredLanguage,
          preferredChannel:   input.preferredChannel,
          primaryDiagnosis:   input.primaryDiagnosis,
          secondaryCondition: input.secondaryCondition,
          clinicianName:      input.clinicianName,
          ward:               input.ward,
          enrolmentDate:      new Date(input.enrolmentDate),
          consentGiven:       input.consentGiven,
        },
      });

      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id }  = getPatientByIdSchema.parse(req.params);
      const input   = updatePatientSchema.parse(req.body);

      const existing = await prisma.patient.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Patient', id);

      const updated = await prisma.patient.update({
        where: { id },
        data:  {
          ...(input.primaryDiagnosis   ? { primaryDiagnosis:   input.primaryDiagnosis }   : {}),
          ...(input.secondaryCondition !== undefined ? { secondaryCondition: input.secondaryCondition } : {}),
          ...(input.clinicianName      ? { clinicianName:      input.clinicianName }      : {}),
          ...(input.ward               ? { ward:               input.ward }               : {}),
          ...(input.phone              ? { phone:              input.phone }              : {}),
          ...(input.preferredLanguage  ? { preferredLanguage:  input.preferredLanguage }  : {}),
          ...(input.preferredChannel   ? { preferredChannel:   input.preferredChannel }   : {}),
        },
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }

  async updateAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id }  = getPatientByIdSchema.parse(req.params);
      const input   = updateAppointmentSchema.parse(req.body);

      const existing = await prisma.patient.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Patient', id);

      const updated = await prisma.patient.update({
        where: { id },
        data:  {
          nextAppointmentDate:     new Date(input.nextAppointmentDate),
          nextAppointmentLocation: input.nextAppointmentLocation,
          apptReminderThreeDays:   input.apptReminderThreeDays,
          apptReminderMorning:     input.apptReminderMorning,
        },
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
