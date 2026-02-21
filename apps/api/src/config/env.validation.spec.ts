import { envValidationSchema, envValidationOptions } from './env.validation';

describe('Environment Validation', () => {
  describe('envValidationSchema', () => {
    it('should validate correct environment variables', () => {
      const validEnv = {
        NODE_ENV: 'development',
        PORT: 3001,
        CORS_ORIGINS: 'http://localhost:3000',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'a'.repeat(32),
        ENCRYPTION_KEY: 'b'.repeat(32),
      };

      const { error } = envValidationSchema.validate(validEnv, envValidationOptions);

      expect(error).toBeUndefined();
    });

    it('should reject missing required DATABASE_URL', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        REDIS_URL: 'redis://localhost:6379',
      };

      const { error } = envValidationSchema.validate(invalidEnv, envValidationOptions);

      expect(error).toBeDefined();
      expect(error?.message).toContain('DATABASE_URL');
    });

    it('should reject missing required REDIS_URL', () => {
      const invalidEnv = {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      };

      const { error } = envValidationSchema.validate(invalidEnv, envValidationOptions);

      expect(error).toBeDefined();
      expect(error?.message).toContain('REDIS_URL');
    });

    it('should apply default values', () => {
      const minimalEnv = {
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
      };

      const { value, error } = envValidationSchema.validate(minimalEnv, envValidationOptions);

      expect(error).toBeUndefined();
      expect(value.NODE_ENV).toBe('development');
      expect(value.PORT).toBe(3001);
      expect(value.CORS_ORIGINS).toBe('http://localhost:3000');
      expect(value.JWT_EXPIRY).toBe('15m');
      expect(value.REFRESH_TOKEN_EXPIRY).toBe('7d');
      expect(value.VAULT_ENABLED).toBe(false);
    });

    it('should validate NODE_ENV options', () => {
      const validEnvironments = ['development', 'staging', 'production', 'test'];

      validEnvironments.forEach((env) => {
        const requiresSecrets = ['staging', 'production'].includes(env);
        const config = {
          NODE_ENV: env,
          DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
          REDIS_URL: 'redis://localhost:6379',
          ...(requiresSecrets && {
            JWT_SECRET: 'a-valid-jwt-secret-that-is-at-least-32-chars-long',
            ENCRYPTION_KEY: 'a-valid-encryption-key-at-least-32-chars-long!',
          }),
        };

        const { error } = envValidationSchema.validate(config, envValidationOptions);
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid NODE_ENV', () => {
      const invalidEnv = {
        NODE_ENV: 'invalid',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
      };

      const { error } = envValidationSchema.validate(invalidEnv, envValidationOptions);

      expect(error).toBeDefined();
      expect(error?.message).toContain('NODE_ENV');
    });

    it('should validate JWT_SECRET minimum length', () => {
      const shortSecret = {
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'short',
      };

      const { error } = envValidationSchema.validate(shortSecret, envValidationOptions);

      expect(error).toBeDefined();
      expect(error?.message).toContain('JWT_SECRET');
    });

    it('should validate ENCRYPTION_KEY minimum length', () => {
      const shortKey = {
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        ENCRYPTION_KEY: 'short',
      };

      const { error } = envValidationSchema.validate(shortKey, envValidationOptions);

      expect(error).toBeDefined();
      expect(error?.message).toContain('ENCRYPTION_KEY');
    });

    it('should require VAULT_ADDR when VAULT_ENABLED is true', () => {
      const vaultEnabled = {
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        VAULT_ENABLED: true,
        // Missing VAULT_ADDR
        VAULT_TOKEN: 'test-token',
      };

      const { error } = envValidationSchema.validate(vaultEnabled, envValidationOptions);

      expect(error).toBeDefined();
      expect(error?.message).toContain('VAULT_ADDR');
    });

    it('should require VAULT_TOKEN when VAULT_ENABLED is true', () => {
      const vaultEnabled = {
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        VAULT_ENABLED: true,
        VAULT_ADDR: 'http://localhost:8200',
        // Missing VAULT_TOKEN
      };

      const { error } = envValidationSchema.validate(vaultEnabled, envValidationOptions);

      expect(error).toBeDefined();
      expect(error?.message).toContain('VAULT_TOKEN');
    });

    it('should allow optional S3 configuration', () => {
      const withS3 = {
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        S3_ENDPOINT: 'http://localhost:9000',
        S3_BUCKET: 'test-bucket',
        S3_REGION: 'us-east-1',
        S3_ACCESS_KEY: 'access-key',
        S3_SECRET_KEY: 'secret-key',
      };

      const { error } = envValidationSchema.validate(withS3, envValidationOptions);

      expect(error).toBeUndefined();
    });

    it('should allow empty SENTRY_DSN', () => {
      const withEmptySentry = {
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        SENTRY_DSN: '',
      };

      const { error } = envValidationSchema.validate(withEmptySentry, envValidationOptions);

      expect(error).toBeUndefined();
    });

    it('should allow unknown environment variables', () => {
      const withUnknown = {
        DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        UNKNOWN_VAR: 'some-value',
      };

      const { error } = envValidationSchema.validate(withUnknown, envValidationOptions);

      expect(error).toBeUndefined();
    });
  });

  describe('envValidationOptions', () => {
    it('should have correct validation options', () => {
      expect(envValidationOptions.abortEarly).toBe(false);
      expect(envValidationOptions.allowUnknown).toBe(true);
    });

    it('should collect all errors when abortEarly is false', () => {
      const multipleErrors = {
        NODE_ENV: 'invalid',
        JWT_SECRET: 'short',
        // Missing DATABASE_URL and REDIS_URL
      };

      const { error } = envValidationSchema.validate(multipleErrors, envValidationOptions);

      expect(error).toBeDefined();
      expect(error?.details).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(1);
    });
  });
});
