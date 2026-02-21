"use strict";
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
        'postgresql://pribec:pribec_dev_password@localhost:5432/pribec_dev';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:3000';
//# sourceMappingURL=setup-e2e.js.map