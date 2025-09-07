import { Test, TestingModule } from '@nestjs/testing';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { SuppliersService } from './suppliers.service';
import { SuppliersStrategy } from './suppliers.strategy';
import { Hotel } from 'src/db/entities/hotel.entity';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let mockEntityManager: jest.Mocked<SqlEntityManager>;
  let mockSuppliersStrategy: jest.Mocked<SuppliersStrategy>;

  beforeEach(async () => {
    mockEntityManager = {
      fork: jest.fn(),
      transactional: jest.fn(),
    } as any;

    mockSuppliersStrategy = {
      fetchData: jest.fn(),
      processSuplier: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: SqlEntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: SuppliersStrategy,
          useValue: mockSuppliersStrategy,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should inject dependencies correctly', () => {
      expect(mockEntityManager).toBeDefined();
      expect(mockSuppliersStrategy).toBeDefined();
    });
  });

  describe('processData', () => {
    it('should delegate to suppliers strategy fetchData', async () => {
      const mockResults = [
        { status: 'fulfilled', value: [{ id: 'hotel1' } as Hotel] },
        { status: 'fulfilled', value: [{ id: 'hotel2' } as Hotel] },
        { status: 'rejected', reason: new Error('Supplier failed') },
      ] as const;

      mockSuppliersStrategy.fetchData.mockResolvedValue(mockResults as any);

      const result = await service.processData();

      expect(mockSuppliersStrategy.fetchData).toHaveBeenCalledTimes(1);
      expect(mockSuppliersStrategy.fetchData).toHaveBeenCalledWith();
      expect(result).toEqual(mockResults);
    });

    it('should handle successful processing of all suppliers', async () => {
      const successfulResults = [
        { status: 'fulfilled', value: [{ id: 'acme1' } as Hotel] },
        { status: 'fulfilled', value: [{ id: 'paperflies1' } as Hotel] },
        { status: 'fulfilled', value: [{ id: 'patagonia1' } as Hotel] },
      ] as const;

      mockSuppliersStrategy.fetchData.mockResolvedValue(
        successfulResults as any,
      );

      const result = await service.processData();

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.status === 'fulfilled')).toBe(true);
    });

    it('should handle mixed success and failure results', async () => {
      const mixedResults = [
        { status: 'fulfilled', value: [{ id: 'success1' } as Hotel] },
        { status: 'rejected', reason: new Error('Network error') },
        { status: 'fulfilled', value: [] },
      ] as const;

      mockSuppliersStrategy.fetchData.mockResolvedValue(mixedResults as any);

      const result = await service.processData();

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe('fulfilled');
      expect(result[1].status).toBe('rejected');
      expect(result[2].status).toBe('fulfilled');
    });

    it('should handle all suppliers failing', async () => {
      const failedResults = [
        { status: 'rejected', reason: new Error('Acme error') },
        { status: 'rejected', reason: new Error('Paperflies error') },
        { status: 'rejected', reason: new Error('Patagonia error') },
      ] as const;

      mockSuppliersStrategy.fetchData.mockResolvedValue(failedResults as any);

      const result = await service.processData();

      expect(result).toHaveLength(3);
      expect(result.every((r) => r.status === 'rejected')).toBe(true);
    });

    it('should handle empty results', async () => {
      const emptyResults = [
        { status: 'fulfilled', value: [] },
        { status: 'fulfilled', value: [] },
        { status: 'fulfilled', value: [] },
      ] as const;

      mockSuppliersStrategy.fetchData.mockResolvedValue(emptyResults as any);

      const result = await service.processData();

      expect(result).toHaveLength(3);
      result.forEach((r) => {
        expect(r.status).toBe('fulfilled');
        if (r.status === 'fulfilled') {
          expect(r.value).toEqual([]);
        }
      });
    });

    it('should propagate strategy errors', async () => {
      const strategyError = new Error('Strategy initialization failed');
      mockSuppliersStrategy.fetchData.mockRejectedValue(strategyError);

      await expect(service.processData()).rejects.toThrow(
        'Strategy initialization failed',
      );
      expect(mockSuppliersStrategy.fetchData).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple concurrent calls', async () => {
      const mockResults = [
        { status: 'fulfilled', value: [{ id: 'concurrent1' } as Hotel] },
      ] as const;

      mockSuppliersStrategy.fetchData.mockResolvedValue(mockResults as any);

      const [result1, result2, result3] = await Promise.all([
        service.processData(),
        service.processData(),
        service.processData(),
      ]);

      expect(mockSuppliersStrategy.fetchData).toHaveBeenCalledTimes(3);
      expect(result1).toEqual(mockResults);
      expect(result2).toEqual(mockResults);
      expect(result3).toEqual(mockResults);
    });

    it('should not modify the results from strategy', async () => {
      const originalResults = [
        { status: 'fulfilled', value: [{ id: 'immutable-test' } as Hotel] },
      ] as const;

      mockSuppliersStrategy.fetchData.mockResolvedValue(originalResults as any);

      const result = await service.processData();

      // Service should return the exact same reference
      expect(result).toBe(originalResults);
    });
  });

  describe('error handling', () => {
    it('should handle strategy throwing synchronous errors', async () => {
      const syncError = new Error('Synchronous error');
      mockSuppliersStrategy.fetchData.mockImplementation(() => {
        throw syncError;
      });

      await expect(service.processData()).rejects.toThrow('Synchronous error');
    });

    it('should handle strategy returning undefined', async () => {
      mockSuppliersStrategy.fetchData.mockResolvedValue(undefined as any);

      const result = await service.processData();
      expect(result).toBeUndefined();
    });

    it('should handle strategy returning null', async () => {
      mockSuppliersStrategy.fetchData.mockResolvedValue(null as any);

      const result = await service.processData();
      expect(result).toBeNull();
    });
  });

  describe('integration aspects', () => {
    it('should work with entity manager and strategy together', () => {
      // This test verifies the service can be constructed with both dependencies
      expect(service).toBeInstanceOf(SuppliersService);

      // Verify dependencies are available (they're private but we can test they exist)
      expect(service.processData).toBeDefined();
    });

    it('should maintain proper dependency injection', () => {
      // The service should have received the mocked dependencies
      expect(mockSuppliersStrategy.fetchData).toHaveBeenCalledTimes(0); // Not called yet

      // Verify the service exists and has the expected method
      expect(service.processData).toBeDefined();
      expect(typeof service.processData).toBe('function');
    });
  });
});
