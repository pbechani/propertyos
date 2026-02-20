import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface VaultSecret {
  data: Record<string, string>;
  metadata?: {
    created_time: string;
    version: number;
  };
}

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly logger = new Logger(VaultService.name);
  private vaultAddr: string;
  private vaultToken: string;
  private enabled: boolean;
  private secretCache: Map<string, { data: Record<string, string>; expiry: number }> = new Map();
  private readonly cacheTtl = 300000; // 5 minutes

  constructor(private readonly configService: ConfigService) {
    this.vaultAddr = this.configService.get<string>('VAULT_ADDR') || 'http://localhost:8200';
    this.vaultToken = this.configService.get<string>('VAULT_TOKEN') || '';
    this.enabled = this.configService.get<boolean>('VAULT_ENABLED', false);
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('Vault is disabled - using environment variables for secrets');
      return;
    }

    if (!this.vaultToken) {
      this.logger.warn('Vault token not configured - secrets management disabled');
      this.enabled = false;
      return;
    }

    try {
      await this.checkHealth();
      this.logger.log('Vault connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Vault', error);
      this.enabled = false;
    }
  }

  private async checkHealth(): Promise<boolean> {
    const response = await fetch(`${this.vaultAddr}/v1/sys/health`);
    if (!response.ok) {
      throw new Error(`Vault health check failed: ${response.status}`);
    }
    return true;
  }

  async getSecret(path: string): Promise<Record<string, string> | null> {
    if (!this.enabled) {
      return null;
    }

    // Check cache first
    const cached = this.secretCache.get(path);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.vaultAddr}/v1/secret/data/${path}`, {
        headers: {
          'X-Vault-Token': this.vaultToken,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          this.logger.warn(`Secret not found at path: ${path}`);
          return null;
        }
        throw new Error(`Failed to fetch secret: ${response.status}`);
      }

      const result = (await response.json()) as { data: VaultSecret };
      const secretData = result.data.data;

      // Cache the secret
      this.secretCache.set(path, {
        data: secretData,
        expiry: Date.now() + this.cacheTtl,
      });

      return secretData;
    } catch (error) {
      this.logger.error(`Error fetching secret from path ${path}:`, error);
      return null;
    }
  }

  async getDatabaseCredentials(): Promise<{ username: string; password: string } | null> {
    const secret = await this.getSecret('pribec/database');
    if (!secret) return null;

    return {
      username: secret.username,
      password: secret.password,
    };
  }

  async getJwtSecret(): Promise<string | null> {
    const secret = await this.getSecret('pribec/jwt');
    return secret?.secret || null;
  }

  async getEncryptionKey(): Promise<string | null> {
    const secret = await this.getSecret('pribec/encryption');
    return secret?.key || null;
  }

  async getExternalApiKey(service: string): Promise<string | null> {
    const secret = await this.getSecret(`pribec/external/${service}`);
    return secret?.api_key || null;
  }

  clearCache(): void {
    this.secretCache.clear();
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
