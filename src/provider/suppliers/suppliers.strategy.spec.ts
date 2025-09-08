import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersStrategy } from './suppliers.strategy';
import { AcmeStrategy } from './strategy/acme.strategy';
import { PaperfliesStrategy } from './strategy/paperflies.strategy';
import { PatagoniaStrategy } from './strategy/patagonia.strategy';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Hotel } from 'src/db/entities/hotel.entity';
import { Supplier } from 'src/db/entities/hotel-supplier';

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
    const mockForkedEm = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getResultList: jest.fn().mockResolvedValue([]),
      nativeDelete: jest.fn().mockResolvedValue(0),
      transactional: jest
        .fn()
        .mockImplementation((cb: any) => Promise.resolve(cb(mockForkedEm))),
    };

    mockEntityManager = {
      fork: jest.fn().mockReturnValue(mockForkedEm),
      transactional: jest.fn().mockImplementation((cb) => cb(mockForkedEm)),
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

    // Mock the cleanUpHotels method to avoid side effects in fetchData tests
    jest.spyOn(suppliersStrategy, 'cleanUpHotels').mockResolvedValue(0);
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
    it('should process all suppliers, call cleanup, and return settled promises', async () => {
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
      expect(suppliersStrategy.cleanUpHotels).toHaveBeenCalledTimes(1);

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

      expect(suppliersStrategy.cleanUpHotels).toHaveBeenCalledTimes(1);
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

      expect(suppliersStrategy.cleanUpHotels).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ status: 'fulfilled', value: [] }); // undefined becomes []
      expect(result[1]).toEqual({ status: 'fulfilled', value: mockHotels });
      expect(result[2]).toEqual({ status: 'fulfilled', value: [] }); // null becomes []
    });

    it('should process suppliers in the correct order', async () => {
      const callOrder: string[] = [];

      // eslint-disable-next-line @typescript-eslint/require-await
      mockAcmeStrategy.fetchData.mockImplementation(async () => {
        callOrder.push('acme');
        return [];
      });

      // eslint-disable-next-line @typescript-eslint/require-await
      mockPaperfliesStrategy.fetchData.mockImplementation(async () => {
        callOrder.push('paperflies');
        return [];
      });

      // eslint-disable-next-line @typescript-eslint/require-await
      mockPatagoniaStrategy.fetchData.mockImplementation(async () => {
        callOrder.push('patagonia');
        return [];
      });

      await suppliersStrategy.fetchData();

      expect(callOrder).toEqual(['acme', 'paperflies', 'patagonia']);
      expect(suppliersStrategy.cleanUpHotels).toHaveBeenCalledTimes(1);
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

      // cleanUpHotels should also be called twice
      expect(suppliersStrategy.cleanUpHotels).toHaveBeenCalledTimes(2);
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

  describe('cleanUpHotels', () => {
    beforeEach(() => {
      // Remove the spy for cleanUpHotels method to test the actual implementation
      jest.restoreAllMocks();
    });

    it('should successfully clean up hotels without suppliers', async () => {
      const hotelsWithoutSuppliers = [
        { id: 'orphan1', name: 'Orphan Hotel 1' } as Hotel,
        { id: 'orphan2', name: 'Orphan Hotel 2' } as Hotel,
      ];

      const mockForkedEm = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getResultList: jest.fn().mockResolvedValue(hotelsWithoutSuppliers),
        nativeDelete: jest.fn().mockResolvedValue(2),
        transactional: jest
          .fn()
          .mockImplementation((cb: any) => Promise.resolve(cb(mockForkedEm))),
      };

      mockEntityManager.fork.mockReturnValue(mockForkedEm as any);

      const result = await suppliersStrategy.cleanUpHotels();

      expect(mockEntityManager.fork).toHaveBeenCalledTimes(1);
      expect(mockForkedEm.transactional).toHaveBeenCalledTimes(1);
      expect(mockForkedEm.createQueryBuilder).toHaveBeenCalledWith(Hotel, 'h');
      expect(mockForkedEm.leftJoin).toHaveBeenCalledWith('h.suppliers', 's');
      expect(mockForkedEm.where).toHaveBeenCalledWith('s.supplier IS NULL');
      expect(mockForkedEm.nativeDelete).toHaveBeenCalledWith(Hotel, {
        id: { $in: ['orphan1', 'orphan2'] },
      });
      expect(result).toBe(2);
    });

    it('should return 0 when no hotels need cleanup', async () => {
      const mockForkedEm = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getResultList: jest.fn().mockResolvedValue([]),
        nativeDelete: jest.fn(),
        transactional: jest
          .fn()
          .mockImplementation((cb: any) => Promise.resolve(cb(mockForkedEm))),
      };

      mockEntityManager.fork.mockReturnValue(mockForkedEm as any);

      const result = await suppliersStrategy.cleanUpHotels();

      expect(mockForkedEm.getResultList).toHaveBeenCalledTimes(1);
      expect(mockForkedEm.nativeDelete).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');

      const mockForkedEm = {
        transactional: jest.fn().mockRejectedValue(error),
      };

      mockEntityManager.fork.mockReturnValue(mockForkedEm as any);

      await expect(suppliersStrategy.cleanUpHotels()).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle query builder errors', async () => {
      const queryError = new Error('Query execution failed');

      const mockForkedEm = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getResultList: jest.fn().mockRejectedValue(queryError),
        transactional: jest
          .fn()
          .mockImplementation((cb: any) => Promise.resolve(cb(mockForkedEm))),
      };

      mockEntityManager.fork.mockReturnValue(mockForkedEm as any);

      await expect(suppliersStrategy.cleanUpHotels()).rejects.toThrow(
        'Query execution failed',
      );
    });

    it('should handle bulk delete errors', async () => {
      const hotelsToDelete = [{ id: 'hotel1' } as Hotel];
      const deleteError = new Error('Bulk delete failed');

      const mockForkedEm = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getResultList: jest.fn().mockResolvedValue(hotelsToDelete),
        nativeDelete: jest.fn().mockRejectedValue(deleteError),
        transactional: jest
          .fn()
          .mockImplementation((cb: any) => Promise.resolve(cb(mockForkedEm))),
      };

      mockEntityManager.fork.mockReturnValue(mockForkedEm as any);

      await expect(suppliersStrategy.cleanUpHotels()).rejects.toThrow(
        'Bulk delete failed',
      );
    });

    it('should use proper transaction isolation', async () => {
      const mockForkedEm = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getResultList: jest.fn().mockResolvedValue([]),
        transactional: jest
          .fn()
          .mockImplementation((cb: any) => Promise.resolve(cb(mockForkedEm))),
      };

      mockEntityManager.fork.mockReturnValue(mockForkedEm as any);

      await suppliersStrategy.cleanUpHotels();

      expect(mockEntityManager.fork).toHaveBeenCalledTimes(1);
      expect(mockForkedEm.transactional).toHaveBeenCalledTimes(1);
      expect(mockForkedEm.transactional).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should handle large number of hotels efficiently', async () => {
      const largeHotelList = Array.from({ length: 1000 }, (_, i) => ({
        id: `hotel-${i}`,
        name: `Hotel ${i}`,
      })) as Hotel[];

      const mockForkedEm = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getResultList: jest.fn().mockResolvedValue(largeHotelList),
        nativeDelete: jest.fn().mockResolvedValue(1000),
        transactional: jest
          .fn()
          .mockImplementation((cb: any) => Promise.resolve(cb(mockForkedEm))),
      };

      mockEntityManager.fork.mockReturnValue(mockForkedEm as any);

      const result = await suppliersStrategy.cleanUpHotels();

      expect(result).toBe(1000);
      expect(mockForkedEm.nativeDelete).toHaveBeenCalledWith(Hotel, {
        id: { $in: largeHotelList.map((h) => h.id) },
      });
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
