import dotenv from 'dotenv';

dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT: {
    ACCESS_SECRET:    process.env.JWT_ACCESS_SECRET  ?? 'dev-access-secret-change-in-prod',
    REFRESH_SECRET:   process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-prod',
    ACCESS_EXPIRES_IN:  '15m',
    REFRESH_EXPIRES_IN: '7d',
  },
  OPENMRS: {
    BASE_URL:             process.env.OPENMRS_BASE_URL             ?? '',
    USERNAME:             process.env.OPENMRS_USERNAME             ?? '',
    PASSWORD:             process.env.OPENMRS_PASSWORD             ?? '',
    LOCATION_UUID:        process.env.OPENMRS_LOCATION_UUID        ?? '',
    IDENTIFIER_TYPE_UUID: process.env.OPENMRS_IDENTIFIER_TYPE_UUID ?? '',
    ENCOUNTER_TYPE_UUID:  process.env.OPENMRS_ENCOUNTER_TYPE_UUID  ?? '',
    PROVIDER_UUID:        process.env.OPENMRS_PROVIDER_UUID        ?? '',
    ENCOUNTER_ROLE_UUID:  process.env.OPENMRS_ENCOUNTER_ROLE_UUID  ?? '',
  },
  GEMINI: {
    API_KEY: process.env.GEMINI_API_KEY ?? '',
    MODEL:   'gemini-2.5-flash-lite',
  },
  AT: {
    API_KEY:   process.env.AT_API_KEY   ?? '',
    USERNAME:  process.env.AT_USERNAME  ?? 'sandbox',
    SENDER_ID: process.env.AT_SENDER_ID ?? '',
  },
  REMINDER: {
    CONFIRM_TIMEOUT_HOURS:          parseInt(process.env.REMINDER_CONFIRM_TIMEOUT_HOURS          ?? '4',  10),
    LIFESTYLE_ADHERENCE_THRESHOLD:  parseInt(process.env.REMINDER_LIFESTYLE_ADHERENCE_THRESHOLD  ?? '50', 10),
  },
} as const;
