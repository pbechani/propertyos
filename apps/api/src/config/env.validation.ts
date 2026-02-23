import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DATABASE_POOL_MIN: Joi.number().default(2),
  DATABASE_POOL_MAX: Joi.number().default(20),

  // Redis
  REDIS_URL: Joi.string().required(),

  // RabbitMQ
  RABBITMQ_URL: Joi.string().optional(),

  // Storage
  S3_ENDPOINT: Joi.string().optional(),
  S3_BUCKET: Joi.string().optional(),
  S3_REGION: Joi.string().optional(),
  S3_ACCESS_KEY: Joi.string().optional(),
  S3_SECRET_KEY: Joi.string().optional(),
  SIGNED_URL_EXPIRY_SECONDS: Joi.number().integer().min(60).default(3600),

  // Secrets
  // Required in staging/production; optional in development/test where Vault may supply them
  JWT_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: Joi.valid('production', 'staging'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  JWT_EXPIRY: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().default(12),
  EMAIL_VERIFICATION_TOKEN_EXPIRY_MINUTES: Joi.number().default(60),
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: Joi.number().default(30),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

  // OAuth
  GOOGLE_OAUTH_CLIENT_ID: Joi.string().optional(),
  APPLE_OAUTH_CLIENT_ID: Joi.string().optional(),
  FACEBOOK_OAUTH_CLIENT_ID: Joi.string().optional(),
  FACEBOOK_APP_ID: Joi.string().optional(),
  FACEBOOK_APP_SECRET: Joi.string().optional(),

  // Notifications
  SENDGRID_API_KEY: Joi.string().optional(),
  SENDGRID_FROM_EMAIL: Joi.string().email().optional(),
  TWILIO_ACCOUNT_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_FROM_NUMBER: Joi.string().optional(),
  NOTIFICATIONS_STRICT_MODE: Joi.boolean().default(false),
  ENCRYPTION_KEY: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: Joi.valid('production', 'staging'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  // Vault
  VAULT_ENABLED: Joi.boolean().default(false),
  VAULT_ADDR: Joi.string().when('VAULT_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  VAULT_TOKEN: Joi.string().when('VAULT_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Observability
  SENTRY_DSN: Joi.string().allow('').optional(),
  ELASTICSEARCH_URL: Joi.string().optional(),
});

export const envValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
};
