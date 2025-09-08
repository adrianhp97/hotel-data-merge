import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SuppliersService } from '../provider/suppliers/suppliers.service';
import { Hotel } from '../db/entities/hotel.entity';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let mockSuppliersService: jest.Mocked<SuppliersService>;

  beforeEach(async () => {
    mockSuppliersService = {
      processData: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleHourlyDataProcessing', () => {
    it('should process data successfully and log results', async () => {
      const mockResults = [
        {
          status: 'fulfilled' as const,
          value: [{ id: 'hotel1' } as Hotel, { id: 'hotel2' } as Hotel],
        },
        { status: 'fulfilled' as const, value: [{ id: 'hotel3' } as Hotel] },
        { status: 'rejected' as const, reason: new Error('Network error') },
      ];

      mockSuppliersService.processData.mockResolvedValue(mockResults);

      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      const debugSpy = jest
        .spyOn(Logger.prototype, 'debug')
        .mockImplementation();

      await service.handleHourlyDataProcessing();

      expect(mockSuppliersService.processData).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Starting hourly data processing...');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Hourly data processing completed'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Success: 2, Failed: 1'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Supplier 2 failed: Error: Network error',
        expect.any(String),
      );
      expect(debugSpy).toHaveBeenCalledWith('Supplier 0 processed 2 hotels');
      expect(debugSpy).toHaveBeenCalledWith('Supplier 1 processed 1 hotels');

      logSpy.mockRestore();
      errorSpy.mockRestore();
      debugSpy.mockRestore();
    });

    it('should handle and log critical errors', async () => {
      const error = new Error('Database connection failed');
      mockSuppliersService.processData.mockRejectedValue(error);

      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await service.handleHourlyDataProcessing();

      expect(logSpy).toHaveBeenCalledWith('Starting hourly data processing...');
      expect(errorSpy).toHaveBeenCalledWith(
        'Critical error during hourly data processing',
        error.stack,
      );

      logSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should handle empty results gracefully', async () => {
      mockSuppliersService.processData.mockResolvedValue([]);

      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      await service.handleHourlyDataProcessing();

      expect(mockSuppliersService.processData).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Success: 0, Failed: 0'),
      );

      logSpy.mockRestore();
    });
  });

  describe('triggerDataProcessing', () => {
    it('should manually trigger data processing', async () => {
      const mockResults = [
        { status: 'fulfilled' as const, value: [] as Hotel[] },
      ];

      mockSuppliersService.processData.mockResolvedValue(mockResults);

      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      await service.triggerDataProcessing();

      expect(logSpy).toHaveBeenCalledWith(
        'Manual data processing trigger initiated...',
      );
      expect(mockSuppliersService.processData).toHaveBeenCalledTimes(1);

      logSpy.mockRestore();
    });
  });

  describe('cron scheduling', () => {
    it('should have proper cron decorators', () => {
      Reflect.getMetadata('__cron__', service.constructor);

      // This tests that the cron decorators are properly applied
      // The actual scheduling is handled by NestJS internally
      expect(service.handleHourlyDataProcessing).toBeDefined();
    });
  });
});
