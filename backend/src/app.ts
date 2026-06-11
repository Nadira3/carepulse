import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './common/middleware/error-handler';
import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patient/patient.routes';
import encounterRoutes from './modules/encounter/encounter.routes';
import prescriptionRoutes from './modules/prescription/prescription.routes';
import reminderRoutes from './modules/reminder/reminder.routes';
import { authenticate } from './common/middleware/authenticate';
import { generalRateLimiter } from './common/middleware/rate-limiter';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3001')
  .split(',')
  .map((o) => o.trim());

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalRateLimiter);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status:    'ok',
    service:   'emr-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth',          authRoutes);
app.use('/api/patients',      authenticate, patientRoutes);
app.use('/api/encounters',    authenticate, encounterRoutes);
app.use('/api/prescriptions', authenticate, prescriptionRoutes);
app.use('/api/reminders',     reminderRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

export default app;
