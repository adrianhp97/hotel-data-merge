import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SchedulerService } from '../../scheduler/scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('trigger-data-processing')
  @HttpCode(HttpStatus.OK)
  async triggerDataProcessing() {
    await this.schedulerService.triggerDataProcessing();
    return {
      message: 'Data processing triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  getSchedulerStatus() {
    return {
      message: 'Scheduler is running',
      cron_jobs: [
        {
          name: 'Frequent Data Processing',
          schedule: '0 * * * * *', // Every minute
          description: 'Processes data from all suppliers every minute',
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
