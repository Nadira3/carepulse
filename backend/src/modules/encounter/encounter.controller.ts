import { Request, Response, NextFunction } from 'express';
import { encounterService } from './encounter.service';
import {
  createEncounterSchema,
  listEncountersSchema,
  getEncounterByIdSchema,
} from './encounter.validation';

export class EncounterController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input    = createEncounterSchema.parse(req.body);
      const encounter = await encounterService.createEncounter(input);
      res.status(201).json(encounter);
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query    = listEncountersSchema.parse(req.query);
      const results  = await encounterService.listEncounters(query);
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id }   = getEncounterByIdSchema.parse(req.params);
      const encounter = await encounterService.getEncounterById(id);
      res.status(200).json(encounter);
    } catch (err) {
      next(err);
    }
  }
}

export const encounterController = new EncounterController();
