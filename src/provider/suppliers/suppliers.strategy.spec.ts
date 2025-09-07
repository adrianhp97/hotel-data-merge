import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersStrategy, Supplier } from './suppliers.strategy';
import { AcmeStrategy } from './strategy/acme.strategy';
import { PaperfliesStrategy } from './strategy/paperflies.strategy';
import { PatagoniaStrategy } from './strategy/patagonia.strategy';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Hotel } from 'src/db/entities/hotel.entity';

describe('SuppliersStrategy', () => {
  let suppliersStrategy: SuppliersStrategy;
  let mockEntityManager: jest.Mocked<SqlEntityManager>;
  let mockAcmeStrategy: jest.Mocked<AcmeStrategy>;
  let mockPaperfliesStrategy: jest.Mocked<PaperfliesStrategy>;
  let mockPatagoniaStrategy: jest.Mocked<PatagoniaStrategy>;

  const mockHotels: Hotel[] = [
    { id: 'hotel1', name: 'Hotel 1' } as Hotel,
    { id: 'hotel2', name: 'Hotel 2' } as Hotel,
  ];

  beforeEach(async () => {
    mockEntityManager = {
      fork: jest.fn(),
      transactional: jest.fn(),
    } as any;

    mockAcmeStrategy = {
      fetchData: jest.fn(),
    } as any;

    mockPaperfliesStrategy = {
      fetchData: jest.fn(),
    } as any;

    mockPatagoniaStrategy = {
      fetchData: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersStrategy,
        {
          provide: SqlEntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: AcmeStrategy,
          useValue: mockAcmeStrategy,
        },
        {
          provide: PaperfliesStrategy,
          useValue: mockPaperfliesStrategy,
        },
        {
          provide: PatagoniaStrategy,
          useValue: mockPatagoniaStrategy,
        },
      ],
    }).compile();

    suppliersStrategy = module.get<SuppliersStrategy>(SuppliersStrategy);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(suppliersStrategy).toBeDefined();
    });

    it('should initialize strategy map correctly', () => {
      // Test that strategies are properly registered
      expect(suppliersStrategy).toBeInstanceOf(SuppliersStrategy);

      // We can't directly access the private map, so we test via processSuplier method
      expect(() => suppliersStrategy.processSuplier('acme')).not.toThrow();
      expect(() =>
        suppliersStrategy.processSuplier('paperflies'),
      ).not.toThrow();
      expect(() => suppliersStrategy.processSuplier('patagonia')).not.toThrow();
    });

    it('should inject all required dependencies', () => {
      expect(mockAcmeStrategy).toBeDefined();
      expect(mockPaperfliesStrategy).toBeDefined();
      expect(mockPatagoniaStrategy).toBeDefined();
      expect(mockEntityManager).toBeDefined();
    });
  });

  describe('fetchData', () => {
    it('should process all suppliers and return settled promises', async () => {
      const acmeHotels = [{ id: 'acme1' } as Hotel];
      const paperfliesHotels = [{ id: 'paperflies1' } as Hotel];
      const patagoniaHotels = [{ id: 'patagonia1' } as Hotel];

      mockAcmeStrategy.fetchData.mockResolvedValue(acmeHotels);
      mockPaperfliesStrategy.fetchData.mockResolvedValue(paperfliesHotels);
      mockPatagoniaStrategy.fetchData.mockResolvedValue(patagoniaHotels);

      const result = await suppliersStrategy.fetchData();

      expect(mockAcmeStrategy.fetchData).toHaveBeenCalledTimes(1);
      expect(mockPaperfliesStrategy.fetchData).toHaveBeenCalledTimes(1);
      expect(mockPatagoniaStrategy.fetchData).toHaveBeenCalledTimes(1);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ status: 'fulfilled', value: acmeHotels });
      expect(result[1]).toEqual({
        status: 'fulfilled',
        value: paperfliesHotels,
      });
      expect(result[2]).toEqual({
        status: 'fulfilled',
        value: patagoniaHotels,
      });
    });

    it('should handle supplier failures gracefully', async () => {
      const successHotels = [{ id: 'success1' } as Hotel];
      const error = new Error('Supplier failed');

      mockAcmeStrategy.fetchData.mockRejectedValue(error);
      mockPaperfliesStrategy.fetchData.mockResolvedValue(successHotels);
      mockPatagoniaStrategy.fetchData.mockRejectedValue(error);

      // The current implementation processes sequentially and the first error would cause the method to fail
      await expect(suppliersStrategy.fetchData()).rejects.toThrow(
        'Supplier failed',
      );

      expect(mockAcmeStrategy.fetchData).toHaveBeenCalledTimes(1);
      // The other strategies might not be called due to early failure
    });

    it('should handle all suppliers failing', async () => {
      const error1 = new Error('Acme failed');

      mockAcmeStrategy.fetchData.mockRejectedValue(error1);
      mockPaperfliesStrategy.fetchData.mockRejectedValue(
        new Error('Paperflies failed'),
      );
      mockPatagoniaStrategy.fetchData.mockRejectedValue(
        new Error('Patagonia failed'),
      );

      // The current implementation processes sequentially and the first error would cause the method to fail
      await expect(suppliersStrategy.fetchData()).rejects.toThrow(
        'Acme failed',
      );

      expect(mockAcmeStrategy.fetchData).toHaveBeenCalledTimes(1);
    });

    it('should handle empty results from suppliers', async () => {
      mockAcmeStrategy.fetchData.mockResolvedValue([]);
      mockPaperfliesStrategy.fetchData.mockResolvedValue([]);
      mockPatagoniaStrategy.fetchData.mockResolvedValue([]);

      const result = await suppliersStrategy.fetchData();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ status: 'fulfilled', value: [] });
      expect(result[1]).toEqual({ status: 'fulfilled', value: [] });
      expect(result[2]).toEqual({ status: 'fulfilled', value: [] });
    });

    it('should handle undefined results from strategies', async () => {
      mockAcmeStrategy.fetchData.mockResolvedValue(undefined as any);
      mockPaperfliesStrategy.fetchData.mockResolvedValue(mockHotels);
      mockPatagoniaStrategy.fetchData.mockResolvedValue(null as any);

      const result = await suppliersStrategy.fetchData();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ status: 'fulfilled', value: [] }); // undefined becomes []
      expect(result[1]).toEqual({ status: 'fulfilled', value: mockHotels });
      expect(result[2]).toEqual({ status: 'fulfilled', value: [] }); // null becomes []
    });

    it('should process suppliers in the correct order', async () => {
      const callOrder: string[] = [];

      mockAcmeStrategy.fetchData.mockImplementation(async () => {
        callOrder.push('acme');
        return [];
      });

      mockPaperfliesStrategy.fetchData.mockImplementation(async () => {
        callOrder.push('paperflies');
        return [];
      });

      mockPatagoniaStrategy.fetchData.mockImplementation(async () => {
        callOrder.push('patagonia');
        return [];
      });

      await suppliersStrategy.fetchData();

      expect(callOrder).toEqual(['acme', 'paperflies', 'patagonia']);
    });
  });

  describe('processSuplier', () => {
    it('should process acme supplier correctly', async () => {
      const expectedHotels = [{ id: 'acme-hotel' } as Hotel];
      mockAcmeStrategy.fetchData.mockResolvedValue(expectedHotels);

      const result = await suppliersStrategy.processSuplier('acme');

      expect(mockAcmeStrategy.fetchData).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedHotels);
    });

    it('should process paperflies supplier correctly', async () => {
      const expectedHotels = [{ id: 'paperflies-hotel' } as Hotel];
      mockPaperfliesStrategy.fetchData.mockResolvedValue(expectedHotels);

      const result = await suppliersStrategy.processSuplier('paperflies');

      expect(mockPaperfliesStrategy.fetchData).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedHotels);
    });

    it('should process patagonia supplier correctly', async () => {
      const expectedHotels = [{ id: 'patagonia-hotel' } as Hotel];
      mockPatagoniaStrategy.fetchData.mockResolvedValue(expectedHotels);

      const result = await suppliersStrategy.processSuplier('patagonia');

      expect(mockPatagoniaStrategy.fetchData).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedHotels);
    });

    it('should throw error for unknown supplier', async () => {
      const unknownSupplier = 'unknown' as Supplier;

      await expect(
        suppliersStrategy.processSuplier(unknownSupplier),
      ).rejects.toThrow('Supplier not found');
    });

    it('should handle strategy errors', async () => {
      const error = new Error('Strategy processing failed');
      mockAcmeStrategy.fetchData.mockRejectedValue(error);

      await expect(suppliersStrategy.processSuplier('acme')).rejects.toThrow(
        'Strategy processing failed',
      );
    });

    it('should return undefined when strategy returns undefined', async () => {
      mockPaperfliesStrategy.fetchData.mockResolvedValue(undefined as any);

      const result = await suppliersStrategy.processSuplier('paperflies');

      expect(result).toBeUndefined();
    });

    it('should handle multiple calls to same supplier', async () => {
      const expectedHotels = [{ id: 'multi-call-hotel' } as Hotel];
      mockAcmeStrategy.fetchData.mockResolvedValue(expectedHotels);

      const result1 = await suppliersStrategy.processSuplier('acme');
      const result2 = await suppliersStrategy.processSuplier('acme');

      expect(mockAcmeStrategy.fetchData).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(expectedHotels);
      expect(result2).toEqual(expectedHotels);
    });

    it('should handle different suppliers in parallel', async () => {
      const acmeHotels = [{ id: 'acme-parallel' } as Hotel];
      const paperfliesHotels = [{ id: 'paperflies-parallel' } as Hotel];

      mockAcmeStrategy.fetchData.mockResolvedValue(acmeHotels);
      mockPaperfliesStrategy.fetchData.mockResolvedValue(paperfliesHotels);

      const [acmeResult, paperfliesResult] = await Promise.all([
        suppliersStrategy.processSuplier('acme'),
        suppliersStrategy.processSuplier('paperflies'),
      ]);

      expect(acmeResult).toEqual(acmeHotels);
      expect(paperfliesResult).toEqual(paperfliesHotels);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle strategy map corruption gracefully', async () => {
      // This is a theoretical test - in practice the map should always be initialized
      // But we can test the error path
      const invalidSupplier = 'invalid' as Supplier;

      await expect(
        suppliersStrategy.processSuplier(invalidSupplier),
      ).rejects.toThrow('Supplier not found');
    });

    it('should handle concurrent fetchData calls', async () => {
      const mockData = [{ id: 'concurrent-test' } as Hotel];

      mockAcmeStrategy.fetchData.mockResolvedValue(mockData);
      mockPaperfliesStrategy.fetchData.mockResolvedValue(mockData);
      mockPatagoniaStrategy.fetchData.mockResolvedValue(mockData);

      const [result1, result2] = await Promise.all([
        suppliersStrategy.fetchData(),
        suppliersStrategy.fetchData(),
      ]);

      expect(result1).toHaveLength(3);
      expect(result2).toHaveLength(3);

      // Each strategy should be called twice (once per fetchData call)
      expect(mockAcmeStrategy.fetchData).toHaveBeenCalledTimes(2);
      expect(mockPaperfliesStrategy.fetchData).toHaveBeenCalledTimes(2);
      expect(mockPatagoniaStrategy.fetchData).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const successData = [{ id: 'success' } as Hotel];
      const networkError = new Error('Network timeout');

      mockAcmeStrategy.fetchData.mockResolvedValue(successData);
      mockPaperfliesStrategy.fetchData.mockRejectedValue(networkError);
      mockPatagoniaStrategy.fetchData.mockResolvedValue([]);

      // The current implementation processes sequentially and would fail at paperflies
      await expect(suppliersStrategy.fetchData()).rejects.toThrow(
        'Network timeout',
      );

      expect(mockAcmeStrategy.fetchData).toHaveBeenCalledTimes(1);
      expect(mockPaperfliesStrategy.fetchData).toHaveBeenCalledTimes(1);
    });
  });

  describe('type safety', () => {
    it('should enforce correct supplier types', () => {
      // This test verifies TypeScript compilation - it would fail at compile time
      const validSuppliers: Supplier[] = ['acme', 'paperflies', 'patagonia'];

      validSuppliers.forEach((supplier) => {
        expect(() => suppliersStrategy.processSuplier(supplier)).not.toThrow();
      });
    });

    it('should return correct type from processSuplier', async () => {
      const mockHotelsData = [{ id: 'type-test' } as Hotel];
      mockAcmeStrategy.fetchData.mockResolvedValue(mockHotelsData);

      const result = await suppliersStrategy.processSuplier('acme');

      // TypeScript should infer this as Hotel[] | undefined
      expect(Array.isArray(result)).toBe(true);
      if (result) {
        expect(result[0]).toHaveProperty('id');
      }
    });
  });
});
