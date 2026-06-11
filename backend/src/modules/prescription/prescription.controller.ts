import { Request, Response, NextFunction } from 'express';
import { prescriptionService } from './prescription.service';
import {
  createPrescriptionSchema,
  updatePrescriptionStatusSchema,
  listPrescriptionsSchema,
  getPrescriptionByIdSchema,
} from './prescription.validation';

export class PrescriptionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input        = createPrescriptionSchema.parse(req.body);
      const prescription = await prescriptionService.createPrescription(input);
      res.status(201).json(prescription);
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query   = listPrescriptionsSchema.parse(req.query);
      const results = await prescriptionService.listPrescriptions(query);
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id }       = getPrescriptionByIdSchema.parse(req.params);
      const prescription = await prescriptionService.getPrescriptionById(id);
      res.status(200).json(prescription);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id }       = getPrescriptionByIdSchema.parse(req.params);
      const input        = updatePrescriptionStatusSchema.parse(req.body);
      const prescription = await prescriptionService.updateStatus(id, input);
      res.status(200).json(prescription);
    } catch (err) {
      next(err);
    }
  }
}

export const prescriptionController = new PrescriptionController();
