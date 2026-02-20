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

  // Secrets
  JWT_SECRET: Joi.string().min(32).optional(),
  JWT_EXPIRY: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: Joi.string().default('7d'),
  ENCRYPTION_KEY: Joi.string().min(32).optional(),

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
