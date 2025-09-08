import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SuppliersModule } from '../provider/suppliers/suppliers.module';

@Module({
  imports: [SuppliersModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
