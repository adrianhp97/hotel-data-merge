import { Test, TestingModule } from '@nestjs/testing';
import { AcmeStrategy } from './acme.strategy';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import supplierConfig from 'src/config/supplier.config';
import { Hotel } from 'src/db/entities/hotel.entity';
import { Destination } from 'src/db/entities/destination.entity';
import { Amenity } from 'src/db/entities/amenity.entity';

// Mock data
const mockAcmeRawHotel = {
  Id: 'iJhz',
  DestinationId: 5432,
  Name: 'Beach Villas Singapore',
  Latitude: 1.264751,
  Longitude: 103.824006,
  Address: '8 Sentosa Gateway',
  City: 'Singapore',
  Country: 'Singapore',
  PostalCode: '098269',
  Description: 'Located at the western tip of Resorts World Sentosa.',
  Facilities: ['Pool', 'BusinessCenter', 'WiFi', 'DryCleaning', 'Breakfast'],
};

const mockConfig = {
  acme: {
    host: 'https://mock-acme-api.com',
  },
};

describe('AcmeStrategy', () => {
  let strategy: AcmeStrategy;
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
        AcmeStrategy,
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

    strategy = module.get<AcmeStrategy>(AcmeStrategy);
  });

  describe('extract', () => {
    it('should fetch data from the API', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue([mockAcmeRawHotel]),
      });

      const result = await strategy.extract();

      expect(global.fetch).toHaveBeenCalledWith('https://mock-acme-api.com');
      expect(result).toEqual([mockAcmeRawHotel]);
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
        city: 'Singapore',
      } as Destination;

      mockHotel = {
        id: 'iJhz',
        name: 'Beach Villas Singapore',
        description: 'Located at the western tip of Resorts World Sentosa.',
        location: {
          lat: 1.264751,
          lng: 103.824006,
          address: '8 Sentosa Gateway, 098269',
          city: 'Singapore',
          country: 'Singapore',
        },
        destination: mockDestination,
        amenities: {
          add: jest.fn(),
          getItems: jest.fn().mockReturnValue([]),
        },
      } as any;

      mockAmenities = [
        { id: 1, name: 'pool', category: 'general' },
        { id: 2, name: 'businesscenter', category: 'general' },
        { id: 3, name: 'wifi', category: 'general' },
      ] as Amenity[];
    });

    it('should create new hotel with proper location data', async () => {
      mockEntityManager.findOne
        .mockResolvedValueOnce(null) // destination not found
        .mockResolvedValueOnce(null); // hotel not found

      mockEntityManager.create
        .mockReturnValueOnce(mockDestination)
        .mockReturnValueOnce(mockHotel)
        .mockImplementation((entity, data) => ({ ...data }) as any);

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        mockAcmeRawHotel,
        mockEntityManager,
      );

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        Hotel,
        expect.objectContaining({
          id: 'iJhz',
          name: 'Beach Villas Singapore',
          description: 'Located at the western tip of Resorts World Sentosa.',
          location: {
            lat: 1.264751,
            lng: 103.824006,
            address: '8 Sentosa Gateway, 098269',
            city: 'Singapore',
            country: 'Singapore',
          },
        }),
      );
    });

    it('should update existing hotel with longer name', async () => {
      const existingHotel = {
        ...mockHotel,
        name: 'Short Name',
        description: 'Short',
        location: {
          lat: 1.0,
          lng: 103.0,
          address: 'Old address',
          city: 'Singapore',
          country: 'Singapore',
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
        mockAcmeRawHotel,
        mockEntityManager,
      );

      expect(result.name).toBe('Beach Villas Singapore'); // longer name
      expect(result.description).toBe(
        'Located at the western tip of Resorts World Sentosa.',
      ); // longer description
      expect(result.location.lat).toBe(1.264751); // updated coordinates
      expect(result.location.lng).toBe(103.824006);
    });

    it('should handle facilities correctly', async () => {
      mockEntityManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockEntityManager.create
        .mockReturnValueOnce(mockDestination)
        .mockReturnValueOnce(mockHotel)
        .mockImplementation(
          (entity, data: any) =>
            ({
              ...data,
              id: entity === Amenity ? Math.random() : data.id,
            }) as any,
        );

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        mockAcmeRawHotel,
        mockEntityManager,
      );

      expect(mockEntityManager.find).toHaveBeenCalledWith(Amenity, {
        name: {
          $in: ['businesscenter', 'drycleaning', 'breakfast', 'pool', 'wifi'],
        },
      });
    });

    it('should handle missing coordinates gracefully', async () => {
      const rawHotelWithoutCoordinates = {
        ...mockAcmeRawHotel,
        Latitude: null as any,
        Longitude: null as any,
      };

      mockEntityManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      mockEntityManager.create
        .mockReturnValueOnce(mockDestination)
        .mockReturnValueOnce({
          ...mockHotel,
          location: {
            lat: undefined,
            lng: undefined,
            address: '8 Sentosa Gateway, 098269',
            city: 'Singapore',
            country: 'Singapore',
          },
        });

      mockEntityManager.find.mockResolvedValue([]);

      const result = await strategy.transform(
        rawHotelWithoutCoordinates,
        mockEntityManager,
      );

      expect(result.location.lat).toBeUndefined();
      expect(result.location.lng).toBeUndefined();
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
        json: jest.fn().mockResolvedValue([mockAcmeRawHotel]),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
    if ('fetch' in global) {
      delete (global as any).fetch;
    }
  });
});
