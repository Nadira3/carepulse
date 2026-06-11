import { Router } from 'express';
import { patientController } from './patient.controller';

const router = Router();

router.get('/stats',     (req, res, next) => patientController.stats(req, res, next));
router.get('/',          (req, res, next) => patientController.list(req, res, next));
router.get('/search',    (req, res, next) => patientController.search(req, res, next));
router.get('/:uuid',     (req, res, next) => patientController.getByUuid(req, res, next));
router.post('/',         (req, res, next) => patientController.create(req, res, next));

export default router;
