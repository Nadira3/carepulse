import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_LOGIN_MAX   ?? '10',   10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    error:   'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_GENERAL_MAX ?? '100',  10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    error:   'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please slow down.',
  },
});
