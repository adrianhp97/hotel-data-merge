import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from 'mikro-orm.config';
import { ApiModule } from 'src/api/api.module';
import { ProviderModule } from 'src/provider/provider.module';
import { ConfigModule } from '@nestjs/config';
import supplierConfig from './config/supplier.config';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    ScheduleModule.forRoot(),
    ApiModule,
    ProviderModule,
    SchedulerModule,
    ConfigModule.forRoot({
      load: [supplierConfig],
    }),
  ],
})
export class AppModule {}
