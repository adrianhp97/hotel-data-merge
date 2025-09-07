import { Module } from '@nestjs/common';
import { HotelsModule } from './hotels/hotels.module';
import { SchedulerController } from './scheduler/scheduler.controller';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [HotelsModule, SchedulerModule],
  controllers: [SchedulerController],
})
export class ApiModule {}
