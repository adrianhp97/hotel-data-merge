import { Test, TestingModule } from '@nestjs/testing';
import { PaperfliesStrategy } from './paperflies.strategy';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import supplierConfig from 'src/config/supplier.config';
import { Hotel } from 'src/db/entities/hotel.entity';
import { Destination } from 'src/db/entities/destination.entity';
import { Amenity, AmenityCategory } from 'src/db/entities/amenity.entity';

// Mock data
const mockPaperfliesRawHotel = {
  hotel_id: 'iJhz',
  destination_id: 5432,
  hotel_name: 'Beach Villas Singapore',
  location: {
    address: '8 Sentosa Gateway, Beach Villas, 098269',
    country: 'Singapore',
  },
  details: 'Surrounded by tropical gardens, on the beachfront.',
  amenities: {
    general: ['outdoor pool', 'indoor pool', 'business center'],
    room: ['tv', 'coffee machine', 'kettle'],
  },
  images: {
    rooms: [
      {
        link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg',
        caption: 'Double room',
      },
    ],
    site: [
      {
        link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/1.jpg',
        caption: 'Front',
      },
    ],
  },
  booking_conditions: ['All children are welcome.', 'WiFi is available.'],
};

const mockConfig = {
  paperflies: {
    host: 'https://mock-paperflies-api.com',
  },
};

describe('PaperfliesStrategy', () => {
  let strategy: PaperfliesStrategy;
  let mockEntityManager: jest.Mocked<SqlEntityManager>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockEntityManager = {
      fork: jest.fn(),
      transactional: jest.fn(),
      create: jest.fn(),
      persist: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      flush: jest.fn(),
      upsert: jest.fn(),
    } as any;

    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaperfliesStrategy,
        {
          provide: SqlEntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: supplierConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    strategy = module.get<PaperfliesStrategy>(PaperfliesStrategy);
  });

  describe('extract', () => {
    it('should fetch data from the API', async () => {
      // Mock global fetch
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue([mockPaperfliesRawHotel]),
      });

      const result = await strategy.extract();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock-paperflies-api.com',
      );
      expect(result).toEqual([mockPaperfliesRawHotel]);
    });

    it('should handle empty response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue([]),
      });

      const result = await strategy.extract();
      expect(result).toEqual([]);
    });
  });

  describe('transform', () => {
    let mockDestination: Destination;
    let mockHotel: Hotel;
    let mockAmenities: Amenity[];

    beforeEach(() => {
      mockDestination = {
        id: 5432,
        country: 'Singapore',
        city: '?',
      } as Destination;

      mockHotel = {
        id: 'iJhz',
        name: 'Beach Villas Singapore',
        description: 'Surrounded by tropical gardens, on the beachfront.',
        location: {
          address: '8 Sentosa Gateway, Beach Villas, 098269',
          city: '?',
          country: 'Singapore',
        },
        destination: mockDestination,
        amenities: {
          add: jest.fn(),
          getItems: jest.fn().mockReturnValue([]),
        },
        suppliers: {
          add: jest.fn(),
          getItems: jest.fn().mockReturnValue([]),
        },
        images: {},
        booking_conditions: ['All children are welcome.', 'WiFi is available.'],
      } as any;

      mockAmenities = [
        { id: 1, name: 'outdoor pool', category: 'general' as AmenityCategory },
        { id: 2, name: 'indoor pool', category: 'general' as AmenityCategory },
        { id: 3, name: 'tv', category: 'room' as AmenityCategory },
      ] as Amenity[];
    });

    it('should create new hotel when it does not exist', async () => {
      mockEntityManager.findOne
        .mockResolvedValueOnce(null) // destination not found
        .mockResolvedValueOnce(null); // hotel not found

      mockEntityManager.create
        .mockReturnValueOnce(mockDestination) // create destination
        .mockReturnValueOnce(mockHotel) // create hotel
        .mockImplementation((entity, data) => ({ ...data }) as any); // create amenities

      mockEntityManager.find.mockResolvedValue(mockAmenities);

      const result = await strategy.transform(
        mockPaperfliesRawHotel,
        mockEntityManager,
      );

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Destination, 5432);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Hotel, 'iJhz', {
        populate: ['destination', 'amenities'],
      });
      expect(mockEntityManager.create).toHaveBeenCalledWith(Destination, {
        id: 5432,
        country: 'Singapore',
        city: '?',
      });
      expect(result.booking_conditions).toEqual([
        'All children are welcome.',
        'WiFi is available.',
      ]);
    });

    it('should update existing hotel', async () => {
      const existingHotel = {
        ...mockHotel,
        name: 'Short Name',
        description: 'Short desc',
        amenities: {
          add: jest.fn(),
          getItems: jest.fn().mockReturnValue([]),
        },
        suppliers: {
          add: jest.fn(),
          getItems: jest.fn().mockReturnValue([]),
        },
      };

      const mockAmenity = { name: 'outdoor pool', category: 'general', id: 1 };

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockDestination) // destination found
        .mockResolvedValueOnce(existingHotel); // hotel found

      mockEntityManager.find.mockResolvedValue([mockAmenity]);
      mockEntityManager.create.mockReturnValue(mockAmenity);

      const result = await strategy.transform(
        mockPaperfliesRawHotel,
        mockEntityManager,
      );

      expect(result.name).toBe('Beach Villas Singapore'); // longer name chosen
      expect(result.description).toBe(
        'Surrounded by tropical gardens, on the beachfront.',
      ); // longer description chosen
      expect(result.booking_conditions).toEqual([
        'All children are welcome.',
        'WiFi is available.',
      ]);
    });

    it('should handle missing amenities data', async () => {
      const rawHotelWithoutAmenities = {
        ...mockPaperfliesRawHotel,
        amenities: {},
      };

      mockEntityManager.findOne
        .mockResolvedValueOnce(null) // destination not found
        .mockResolvedValueOnce(null); // hotel not found

      mockEntityManager.create
        .mockReturnValueOnce(mockDestination)
        .mockReturnValueOnce(mockHotel);

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        rawHotelWithoutAmenities,
        mockEntityManager,
      );

      expect(mockEntityManager.find).toHaveBeenCalledWith(Amenity, {
        name: { $in: [] },
      });
      expect(result).toBeDefined();
    });

    it('should handle missing images data', async () => {
      const rawHotelWithoutImages = {
        ...mockPaperfliesRawHotel,
        images: {},
      };

      const mockAmenity = { name: 'outdoor pool', category: 'general', id: 1 };

      mockEntityManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockEntityManager.create
        .mockReturnValueOnce(mockDestination)
        .mockReturnValueOnce(mockHotel)
        .mockReturnValue(mockAmenity);

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        rawHotelWithoutImages,
        mockEntityManager,
      );

      expect(result.images).toEqual({
        site: [],
        rooms: [],
      });
    });
  });

  describe('loads', () => {
    it('should flush all hotels and return them', async () => {
      const mockHotels = [{ id: 'hotel1' } as Hotel, { id: 'hotel2' } as Hotel];

      mockEntityManager.flush.mockResolvedValue(undefined);

      const result = await strategy.loads(mockHotels, mockEntityManager);

      expect(mockEntityManager.flush).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockHotels);
    });

    it('should handle empty hotel array', async () => {
      const result = await strategy.loads([], mockEntityManager);

      expect(mockEntityManager.flush).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('fetchData', () => {
    it('should execute the complete data pipeline within a transaction', async () => {
      const mockTransactionCallback = jest.fn();
      const mockForkedEm = {
        transactional: jest.fn().mockImplementation((callback) => {
          return callback(mockEntityManager);
        }),
      } as any;

      mockEntityManager.fork.mockReturnValue(mockForkedEm);

      // Mock the extract method
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue([mockPaperfliesRawHotel]),
      });

      // Mock transform dependencies
      mockEntityManager.findOne
        .mockResolvedValue(null) // destination
        .mockResolvedValue(null); // hotel

      mockEntityManager.create
        .mockReturnValue({ id: 5432, country: 'Singapore', city: '?' }) // destination
        .mockReturnValue({
          id: 'iJhz',
          amenities: { add: jest.fn(), getItems: () => [] },
          suppliers: { add: jest.fn(), getItems: () => [] },
          images: {},
        }); // hotel

      mockEntityManager.find.mockResolvedValue([]);
      mockEntityManager.flush.mockResolvedValue(undefined);

      const result = await strategy.fetchData();

      expect(mockEntityManager.fork).toHaveBeenCalled();
      expect(mockForkedEm.transactional).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock-paperflies-api.com',
      );
      expect(result).toBeDefined();
    });

    it('should handle transaction rollback on error', async () => {
      const mockForkedEm = {
        transactional: jest
          .fn()
          .mockRejectedValue(new Error('Transaction failed')),
      } as any;

      mockEntityManager.fork.mockReturnValue(mockForkedEm);

      await expect(strategy.fetchData()).rejects.toThrow('Transaction failed');
      expect(mockEntityManager.fork).toHaveBeenCalled();
      expect(mockForkedEm.transactional).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    if ('fetch' in global) {
      delete (global as any).fetch;
    }
  });
});
