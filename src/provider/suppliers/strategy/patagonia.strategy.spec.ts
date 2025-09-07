import { Test, TestingModule } from '@nestjs/testing';
import { PatagoniaStrategy } from './patagonia.strategy';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import supplierConfig from 'src/config/supplier.config';
import { Hotel } from 'src/db/entities/hotel.entity';
import { Destination } from 'src/db/entities/destination.entity';
import { Amenity } from 'src/db/entities/amenity.entity';

// Mock data
const mockPatagoniaRawHotel = {
  id: 'iJhz',
  destination: 5432,
  name: 'Beach Villas Singapore',
  lat: 1.264751,
  lng: 103.824006,
  address: '8 Sentosa Gateway, Beach Villas',
  info: 'Located at the western tip of Resorts World Sentosa.',
  amenities: ['Pool', 'BusinessCenter', 'WiFi'],
  images: {
    rooms: [
      {
        url: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg',
        description: 'Double room',
      },
    ],
    amenities: [
      {
        url: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/3.jpg',
        description: 'Pool',
      },
    ],
  },
};

const mockPatagoniaRawHotelNullAddress = {
  ...mockPatagoniaRawHotel,
  address: null,
};

const mockConfig = {
  patagonia: {
    host: 'https://mock-patagonia-api.com',
  },
};

describe('PatagoniaStrategy', () => {
  let strategy: PatagoniaStrategy;
  let mockEntityManager: jest.Mocked<SqlEntityManager>;

  beforeEach(async () => {
    mockEntityManager = {
      fork: jest.fn(),
      transactional: jest.fn(),
      create: jest.fn(),
      persist: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      flush: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatagoniaStrategy,
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

    strategy = module.get<PatagoniaStrategy>(PatagoniaStrategy);
  });

  describe('extract', () => {
    it('should fetch data from the API', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue([mockPatagoniaRawHotel]),
      });

      const result = await strategy.extract();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock-patagonia-api.com',
      );
      expect(result).toEqual([mockPatagoniaRawHotel]);
    });
  });

  describe('transform', () => {
    let mockDestination: Destination;
    let mockHotel: Hotel;

    beforeEach(() => {
      mockDestination = {
        id: 5432,
        country: '?',
        city: '?',
      } as Destination;

      mockHotel = {
        id: 'iJhz',
        name: 'Beach Villas Singapore',
        location: {
          lat: 1.264751,
          lng: 103.824006,
          address: '8 Sentosa Gateway, Beach Villas',
          city: '?',
          country: '?',
        },
        destination: mockDestination,
        amenities: {
          add: jest.fn(),
          getItems: jest.fn().mockReturnValue([]),
        },
        images: {},
      } as any;
    });

    it('should create new hotel', async () => {
      mockEntityManager.findOne
        .mockResolvedValueOnce(null) // destination not found
        .mockResolvedValueOnce(null); // hotel not found

      mockEntityManager.create
        .mockReturnValueOnce(mockDestination)
        .mockReturnValueOnce(mockHotel)
        .mockImplementation((entity, data) => ({ ...data }) as any);

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        mockPatagoniaRawHotel,
        mockEntityManager,
      );

      expect(mockEntityManager.create).toHaveBeenCalledWith(Destination, {
        id: 5432,
        country: '?',
        city: '?',
      });

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        Hotel,
        expect.objectContaining({
          id: 'iJhz',
          name: 'Beach Villas Singapore',
          location: {
            lat: 1.264751,
            lng: 103.824006,
            address: '8 Sentosa Gateway, Beach Villas',
            city: '?',
            country: '?',
          },
        }),
      );
    });

    it('should handle null address', async () => {
      mockEntityManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockEntityManager.create
        .mockReturnValueOnce(mockDestination)
        .mockReturnValueOnce({
          ...mockHotel,
          location: {
            ...mockHotel.location,
            address: undefined,
          },
        });

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        mockPatagoniaRawHotelNullAddress,
        mockEntityManager,
      );

      expect(result.location.address).toBeUndefined();
    });

    it('should merge images correctly', async () => {
      const existingHotel = {
        ...mockHotel,
        images: {
          rooms: [{ link: 'existing-room.jpg', description: 'Existing room' }],
          amenities: [
            { link: 'existing-amenity.jpg', description: 'Existing amenity' },
          ],
        },
        amenities: {
          add: jest.fn(),
          getItems: jest.fn().mockReturnValue([]),
        },
      };

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockDestination)
        .mockResolvedValueOnce(existingHotel);

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        mockPatagoniaRawHotel,
        mockEntityManager,
      );

      expect(result.images?.rooms).toHaveLength(2); // existing + new
      expect(result.images?.amenities).toHaveLength(2); // existing + new
      expect(result.images?.rooms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ link: 'existing-room.jpg' }),
          expect.objectContaining({
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg',
          }),
        ]),
      );
    });

    it('should handle missing amenities', async () => {
      const rawHotelWithoutAmenities = {
        ...mockPatagoniaRawHotel,
        amenities: undefined,
      };

      mockEntityManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

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
    });

    it('should handle missing images', async () => {
      const rawHotelWithoutImages = {
        ...mockPatagoniaRawHotel,
        images: {
          rooms: undefined,
          amenities: undefined,
        },
      };

      mockEntityManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockEntityManager.create
        .mockReturnValueOnce(mockDestination)
        .mockReturnValueOnce(mockHotel);

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        rawHotelWithoutImages,
        mockEntityManager,
      );

      expect(result.images?.amenities).toEqual([]);
      expect(result.images?.rooms).toEqual([]);
    });

    it('should update existing hotel with merged data', async () => {
      const existingHotel = {
        id: 'iJhz',
        name: 'Short',
        location: {
          lat: 1.0,
          lng: 103.0,
          address: 'Old address',
          city: '?',
          country: '?',
        },
        destination: mockDestination,
        amenities: {
          add: jest.fn(),
          getItems: jest.fn().mockReturnValue([]),
        },
        images: {},
      };

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockDestination)
        .mockResolvedValueOnce(existingHotel);

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        mockPatagoniaRawHotel,
        mockEntityManager,
      );

      expect(result.name).toBe('Beach Villas Singapore'); // longer name chosen
      // Based on the spread order, existing location values will override new ones
      expect(result.location.lat).toBe(1.0); // existing value preserved
      expect(result.location.lng).toBe(103.0); // existing value preserved
      expect(result.location.address).toBe('Old address'); // existing value preserved
      expect(result).toBe(existingHotel); // Should be the same instance
    });
  });

  describe('loads', () => {
    it('should flush all hotels', async () => {
      const mockHotels = [{ id: 'hotel1' } as Hotel, { id: 'hotel2' } as Hotel];

      mockEntityManager.flush.mockResolvedValue(undefined);

      const result = await strategy.loads(mockHotels, mockEntityManager);

      expect(mockEntityManager.flush).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockHotels);
    });
  });

  describe('fetchData', () => {
    it('should execute within transaction', async () => {
      const mockForkedEm = {
        transactional: jest.fn().mockImplementation((callback) => {
          return callback(mockEntityManager);
        }),
      } as any;

      mockEntityManager.fork.mockReturnValue(mockForkedEm);

      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue([mockPatagoniaRawHotel]),
      });

      mockEntityManager.findOne.mockResolvedValue(null);
      mockEntityManager.create.mockImplementation(
        (entity, data) =>
          ({
            ...data,
            amenities:
              entity === Hotel
                ? { add: jest.fn(), getItems: () => [] }
                : undefined,
          }) as any,
      );
      mockEntityManager.find.mockResolvedValue([]);
      mockEntityManager.flush.mockResolvedValue(undefined);

      const result = await strategy.fetchData();

      expect(mockEntityManager.fork).toHaveBeenCalled();
      expect(mockForkedEm.transactional).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle API errors', async () => {
      const mockForkedEm = {
        transactional: jest.fn().mockImplementation((callback) => {
          return callback(mockEntityManager);
        }),
      } as any;

      mockEntityManager.fork.mockReturnValue(mockForkedEm);

      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(strategy.fetchData()).rejects.toThrow('API Error');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    if ('fetch' in global) {
      delete (global as any).fetch;
    }
  });
});
