import { Router } from 'express';
import { reminderController } from './reminder.controller';
import { authenticate } from '../../common/middleware/authenticate';

const router = Router();

// Public — Africa's Talking posts here when patient replies
router.post('/webhook', (req, res, next) => reminderController.handleWebhook(req, res, next));

// Protected — clinician dashboard reads reminders
router.get('/', authenticate, (req, res, next) => reminderController.list(req, res, next));

export default router;

// Manual trigger — authenticated clinicians can fire reminders on demand
router.post('/trigger', authenticate, (req, res, next) => reminderController.trigger(req, res, next));
