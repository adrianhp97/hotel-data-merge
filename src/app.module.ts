import { Module } from '@nestjs/common';

import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from 'mikro-orm.config';
import { ApiModule } from 'src/api/api.module';
import { ProviderModule } from 'src/provider/provider.module';
import { ConfigModule } from '@nestjs/config';
import supplierConfig from './config/supplier.config';

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    ApiModule,
    ProviderModule,
    ConfigModule.forRoot({
      load: [supplierConfig],
    }),
  ],
})
export class AppModule {}
