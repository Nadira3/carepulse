import { Router } from 'express';
import { prescriptionController } from './prescription.controller';
import { authenticate } from '../../common/middleware/authenticate';

const router = Router();

router.use(authenticate);

router.post('/',           (req, res, next) => prescriptionController.create(req, res, next));
router.get('/',            (req, res, next) => prescriptionController.list(req, res, next));
router.get('/:id',         (req, res, next) => prescriptionController.getById(req, res, next));
router.patch('/:id/status',(req, res, next) => prescriptionController.updateStatus(req, res, next));

export default router;
