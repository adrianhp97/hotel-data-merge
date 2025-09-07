import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SuppliersService } from '../provider/suppliers/suppliers.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly suppliersService: SuppliersService) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'hourly-data-processing',
    timeZone: 'UTC',
  })
  async handleHourlyDataProcessing() {
    this.logger.log('Starting data processing...');

    try {
      const startTime = Date.now();
      const results = await this.suppliersService.processData();
      const duration = Date.now() - startTime;

      // Log summary of results
      const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
      const rejected = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(
        `Data processing completed in ${duration}ms. ` +
          `Success: ${fulfilled}, Failed: ${rejected}`,
      );

      // Log any failures for investigation
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          this.logger.error(
            `Supplier ${index} failed: ${result.reason}`,
            result.reason instanceof Error ? result.reason.stack : undefined,
          );
        } else {
          const hotelCount = result.value?.length || 0;
          this.logger.debug(`Supplier ${index} processed ${hotelCount} hotels`);
        }
      });
    } catch (error) {
      this.logger.error(
        'Critical error during data processing',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // Manual trigger endpoint for testing/debugging
  async triggerDataProcessing() {
    this.logger.log('Manual data processing trigger initiated...');
    return this.handleHourlyDataProcessing();
  }
}
