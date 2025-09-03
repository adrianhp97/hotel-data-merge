import { Module } from '@nestjs/common';

import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [SuppliersModule],
})
export class ProviderModule {}
