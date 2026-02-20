import { Module, DynamicModule, Global } from '@nestjs/common';
import { VaultService } from './vault.service';

export interface VaultModuleOptions {
  enabled?: boolean;
  address?: string;
  token?: string;
}

@Global()
@Module({})
export class VaultModule {
  static forRoot(options: VaultModuleOptions = {}): DynamicModule {
    return {
      module: VaultModule,
      providers: [
        {
          provide: 'VAULT_OPTIONS',
          useValue: {
            enabled: options.enabled ?? false,
            address: options.address ?? 'http://localhost:8200',
            token: options.token ?? '',
          },
        },
        VaultService,
      ],
      exports: [VaultService],
    };
  }
}
