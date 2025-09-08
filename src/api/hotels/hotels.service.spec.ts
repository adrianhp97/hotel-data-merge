import { Test, TestingModule } from '@nestjs/testing';
import { HotelsService } from './hotels.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Hotel } from 'src/db/entities/hotel.entity';
import { HotelRepository } from 'src/db/entities/repositories/hotel.repository';
import { SuppliersService } from 'src/provider/suppliers/suppliers.service';
import { GetHotelsParameterDTO } from './hotels.schema';
import { Destination } from 'src/db/entities/destination.entity';
import { Amenity, AmenityCategory } from 'src/db/entities/amenity.entity';
import { HotelDTO } from 'src/dto/hotel.dto';
import { HotelTransformer } from 'src/transformers/hotel.transformer';
import { PaginatedResponse } from 'src/dto/paginated-response.dto';

// Mock HotelTransformer as it's a static class
jest.mock('src/transformers/hotel.transformer');

describe('HotelsService', () => {
  let service: HotelsService;
  let mockHotelRepository: jest.Mocked<HotelRepository>;
  let mockSuppliersService: jest.Mocked<SuppliersService>;
  let mockHotelTransformer: jest.Mocked<typeof HotelTransformer>;

  // Mock data
  const mockDestination: Destination = {
    id: 5432,
    country: 'Singapore',
    city: 'Singapore',
  } as unknown as Destination;

  const mockAmenities: Amenity[] = [
    {
      id: 1,
      name: 'Outdoor Pool',
      category: 'general' as AmenityCategory,
    } as unknown as Amenity,
    {
      id: 2,
      name: 'WiFi',
      category: 'general' as AmenityCategory,
    } as unknown as Amenity,
  ];

  const mockHotels: Hotel[] = [
    {
      id: 'iJhz',
      name: 'Beach Villas Singapore',
      location: {
        lat: 1.264751,
        lng: 103.824006,
        address: '8 Sentosa Gateway, Beach Villas, 098269',
        city: 'Singapore',
        country: 'Singapore',
      },
      description: 'Located at the western tip of Resorts World Sentosa.',
      destination: mockDestination,
      amenities: mockAmenities,
      images: {
        rooms: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg',
            description: 'Double room',
          },
        ],
        site: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/1.jpg',
            description: 'Front',
          },
        ],
      },
      booking_conditions: [],
    } as unknown as Hotel,
    {
      id: 'SjyX',
      name: 'InterContinental Singapore Robertson Quay',
      location: {
        lat: 1.28967,
        lng: 103.84675,
        address: '1 Nanson Road, Singapore 238909',
        city: 'Singapore',
        country: 'Singapore',
      },
      description: 'Enjoy sophisticated hotel living with InterContinental.',
      destination: mockDestination,
      amenities: mockAmenities,
      images: {
        rooms: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/Sjym/0.jpg',
            description: 'Suite',
          },
        ],
        site: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/Sjym/1.jpg',
            description: 'Restaurant',
          },
        ],
      },
      booking_conditions: ['All children are welcome.'],
    } as unknown as Hotel,
  ];

  const mockHotelDTOs: HotelDTO[] = [
    {
      id: 'iJhz',
      destination_id: 5432,
      name: 'Beach Villas Singapore',
      location: {
        lat: 1.264751,
        lng: 103.824006,
        address: '8 Sentosa Gateway, Beach Villas, 098269',
        city: 'Singapore',
        country: 'Singapore',
      },
      description: 'Located at the western tip of Resorts World Sentosa.',
      amenities: {
        general: ['Outdoor Pool', 'WiFi'],
        room: [],
      },
      images: {
        rooms: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg',
            description: 'Double room',
          },
        ],
        site: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/1.jpg',
            description: 'Front',
          },
        ],
        amenities: [],
      },
      booking_conditions: [],
    },
    {
      id: 'SjyX',
      destination_id: 5432,
      name: 'InterContinental Singapore Robertson Quay',
      location: {
        lat: 1.28967,
        lng: 103.84675,
        address: '1 Nanson Road, Singapore 238909',
        city: 'Singapore',
        country: 'Singapore',
      },
      description: 'Enjoy sophisticated hotel living with InterContinental.',
      amenities: {
        general: ['Outdoor Pool', 'WiFi'],
        room: [],
      },
      images: {
        rooms: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/Sjym/0.jpg',
            description: 'Suite',
          },
        ],
        site: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/Sjym/1.jpg',
            description: 'Restaurant',
          },
        ],
        amenities: [],
      },
      booking_conditions: ['All children are welcome.'],
    },
  ];

  beforeEach(async () => {
    mockHotelRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      persist: jest.fn(),
      remove: jest.fn(),
      flush: jest.fn(),
    } as any;

    mockSuppliersService = {
      processData: jest.fn(),
    } as any;

    mockHotelTransformer = HotelTransformer as jest.Mocked<typeof HotelTransformer>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelsService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockHotelRepository,
        },
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    }).compile();

    service = module.get<HotelsService>(HotelsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should inject SuppliersService correctly', () => {
      expect(mockSuppliersService).toBeDefined();
    });
  });

  describe('getHotels', () => {
    beforeEach(() => {
      mockHotelTransformer.toDTO = jest.fn().mockImplementation((hotel: Hotel) => {
        const index = mockHotels.findIndex((h) => h.id === hotel.id);
        return mockHotelDTOs[index] || mockHotelDTOs[0];
      });
    });

    it('should return paginated hotels when no parameters provided', async () => {
      const parameter: GetHotelsParameterDTO = { page: 1, limit: 10 };
      mockHotelRepository.count.mockResolvedValue(2);
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.count).toHaveBeenCalledWith({});
      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {},
        {
          populate: ['amenities', 'destination'],
          limit: 10,
          offset: 0,
        },
      );
      expect(mockHotelTransformer.toDTO).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        data: mockHotelDTOs,
        pagination: {
          current_page: 1,
          per_page: 10,
          total: 2,
          total_pages: 1,
          has_next_page: false,
          has_previous_page: false,
        },
      });
    });

    it('should filter hotels by destination_id', async () => {
      const parameter: GetHotelsParameterDTO = { destination_id: 5432, page: 1, limit: 10 };
      mockHotelRepository.count.mockResolvedValue(2);
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.count).toHaveBeenCalledWith({ destination: 5432 });
      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        { destination: 5432 },
        {
          populate: ['amenities', 'destination'],
          limit: 10,
          offset: 0,
        },
      );
      expect(result.data).toEqual(mockHotelDTOs);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter hotels by hotel_ids', async () => {
      const parameter: GetHotelsParameterDTO = {
        hotel_ids: ['hotel1', 'hotel2'],
        page: 1,
        limit: 10,
      };
      mockHotelRepository.count.mockResolvedValue(2);
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.count).toHaveBeenCalledWith({
        id: {
          $in: ['hotel1', 'hotel2'],
        },
      });
      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {
          id: {
            $in: ['hotel1', 'hotel2'],
          },
        },
        {
          populate: ['amenities', 'destination'],
          limit: 10,
          offset: 0,
        },
      );
      expect(result.data).toEqual(mockHotelDTOs);
    });

    it('should filter hotels by both destination_id and hotel_ids', async () => {
      const parameter: GetHotelsParameterDTO = {
        destination_id: 5432,
        hotel_ids: ['hotel1'],
        page: 1,
        limit: 10,
      };
      mockHotelRepository.count.mockResolvedValue(1);
      mockHotelRepository.find.mockResolvedValue([mockHotels[0]]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.count).toHaveBeenCalledWith({
        destination: 5432,
        id: {
          $in: ['hotel1'],
        },
      });
      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {
          destination: 5432,
          id: {
            $in: ['hotel1'],
          },
        },
        {
          populate: ['amenities', 'destination'],
          limit: 10,
          offset: 0,
        },
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockHotelDTOs[0]);
    });

    it('should return empty data when no hotels found', async () => {
      const parameter: GetHotelsParameterDTO = { destination_id: 9999, page: 1, limit: 10 };
      mockHotelRepository.count.mockResolvedValue(0);
      mockHotelRepository.find.mockResolvedValue([]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.count).toHaveBeenCalledWith({ destination: 9999 });
      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        { destination: 9999 },
        {
          populate: ['amenities', 'destination'],
          limit: 10,
          offset: 0,
        },
      );
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(mockHotelTransformer.toDTO).not.toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const parameter: GetHotelsParameterDTO = { page: 2, limit: 5 };
      mockHotelRepository.count.mockResolvedValue(15);
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {},
        {
          populate: ['amenities', 'destination'],
          limit: 5,
          offset: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
        },
      );
      expect(result.pagination).toEqual({
        current_page: 2,
        per_page: 5,
        total: 15,
        total_pages: 3, // Math.ceil(15 / 5) = 3
        has_next_page: true, // page 2 < 3 total pages
        has_previous_page: true, // page 2 > 1
      });
    });

    it('should use default pagination values', async () => {
      const parameter: GetHotelsParameterDTO = { page: 1, limit: 10 }; // Explicit pagination values
      mockHotelRepository.count.mockResolvedValue(2);
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {},
        {
          populate: ['amenities', 'destination'],
          limit: 10,
          offset: 0,
        },
      );
      expect(result.pagination).toEqual({
        current_page: 1,
        per_page: 10,
        total: 2,
        total_pages: 1,
        has_next_page: false,
        has_previous_page: false,
      });
    });

    it('should handle edge case with large page number', async () => {
      const parameter: GetHotelsParameterDTO = { page: 10, limit: 5 };
      mockHotelRepository.count.mockResolvedValue(7); // Only 7 total items
      mockHotelRepository.find.mockResolvedValue([]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {},
        {
          populate: ['amenities', 'destination'],
          limit: 5,
          offset: 45, // (10 - 1) * 5 = 45
        },
      );
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        current_page: 10,
        per_page: 5,
        total: 7,
        total_pages: 2, // Math.ceil(7 / 5) = 2
        has_next_page: false, // page 10 > 2 total pages
        has_previous_page: true, // page 10 > 1
      });
    });
  });
});