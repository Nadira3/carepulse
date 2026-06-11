import { Router } from 'express';
import { encounterController } from './encounter.controller';
import { authenticate } from '../../common/middleware/authenticate';

const router = Router();

router.use(authenticate);

router.post('/',     (req, res, next) => encounterController.create(req, res, next));
router.get('/',      (req, res, next) => encounterController.list(req, res, next));
router.get('/:id',   (req, res, next) => encounterController.getById(req, res, next));

export default router;
