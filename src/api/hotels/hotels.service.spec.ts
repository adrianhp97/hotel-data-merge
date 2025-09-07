import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { HotelsService } from './hotels.service';
import { HotelRepository } from 'src/db/entities/repositories/hotel.repository';
import { SuppliersService } from 'src/provider/suppliers/suppliers.service';
import { GetHotelsParameterDTO } from './hotels.schema';
import { Hotel } from 'src/db/entities/hotel.entity';
import { HotelDTO } from 'src/dto/hotel.dto';
import { HotelTransformer } from 'src/transformers/hotel.transformer';
import { Destination } from 'src/db/entities/destination.entity';
import { Amenity, AmenityCategory } from 'src/db/entities/amenity.entity';
import { Collection } from '@mikro-orm/core';

// Mock the HotelTransformer
jest.mock('src/transformers/hotel.transformer');

describe('HotelsService', () => {
  let service: HotelsService;
  let mockHotelRepository: jest.Mocked<HotelRepository>;
  let mockSuppliersService: jest.Mocked<SuppliersService>;
  let mockHotelTransformer: jest.Mocked<typeof HotelTransformer>;

  const mockDestination = {
    id: 5432,
    name: 'Singapore',
  } as unknown as Destination;

  const mockAmenities: Amenity[] = [
    {
      id: 1,
      name: 'WiFi',
      category: 'general',
    } as unknown as Amenity,
    {
      id: 2,
      name: 'Pool',
      category: 'general',
    } as unknown as Amenity,
    {
      id: 3,
      name: 'Air conditioning',
      category: 'room',
    } as unknown as Amenity,
  ];

  const mockHotels: Hotel[] = [
    {
      id: 'hotel1',
      name: 'Beach Resort',
      destination: mockDestination,
      location: {
        lat: 1.264751,
        lng: 103.824006,
        address: '8 Sentosa Gateway, Beach Villas, 098269',
        city: 'Singapore',
        country: 'Singapore',
      },
      description: 'A beautiful beach resort',
      amenities: {
        getItems: () => [mockAmenities[0], mockAmenities[1]],
        add: jest.fn(),
      } as unknown as Collection<Amenity>,
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
      booking_conditions: [
        'All children are welcome.',
        'WiFi is available in all areas.',
      ],
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    } as unknown as Hotel,
    {
      id: 'hotel2',
      name: 'City Hotel',
      destination: mockDestination,
      location: {
        lat: 1.290270,
        lng: 103.851959,
        address: '61 Boat Quay, Singapore 049847',
        city: 'Singapore',
        country: 'Singapore',
      },
      description: 'A modern city hotel',
      amenities: {
        getItems: () => [mockAmenities[0], mockAmenities[2]],
        add: jest.fn(),
      } as unknown as Collection<Amenity>,
      images: {
        rooms: [],
        site: [],
        amenities: [],
      },
      booking_conditions: ['Pets allowed', 'Free breakfast'],
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    } as unknown as Hotel,
  ];

  const mockHotelDTOs: HotelDTO[] = [
    {
      id: 'hotel1',
      destination_id: 5432,
      name: 'Beach Resort',
      location: {
        lat: 1.264751,
        lng: 103.824006,
        address: '8 Sentosa Gateway, Beach Villas, 098269',
        city: 'Singapore',
        country: 'Singapore',
      },
      description: 'A beautiful beach resort',
      amenities: {
        general: ['WiFi', 'Pool'],
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
      booking_conditions: [
        'All children are welcome.',
        'WiFi is available in all areas.',
      ],
    },
    {
      id: 'hotel2',
      destination_id: 5432,
      name: 'City Hotel',
      location: {
        lat: 1.290270,
        lng: 103.851959,
        address: '61 Boat Quay, Singapore 049847',
        city: 'Singapore',
        country: 'Singapore',
      },
      description: 'A modern city hotel',
      amenities: {
        general: ['WiFi'],
        room: ['Air conditioning'],
      },
      images: {
        rooms: [],
        site: [],
        amenities: [],
      },
      booking_conditions: ['Pets allowed', 'Free breakfast'],
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

    it('should inject dependencies correctly', () => {
      expect(mockHotelRepository).toBeDefined();
      expect(mockSuppliersService).toBeDefined();
    });
  });

  describe('getHotels', () => {
    beforeEach(() => {
      mockSuppliersService.processData.mockResolvedValue([] as any);
      mockHotelTransformer.toDTO = jest.fn().mockImplementation((hotel: Hotel) => {
        const index = mockHotels.findIndex((h) => h.id === hotel.id);
        return mockHotelDTOs[index] || mockHotelDTOs[0];
      });
    });

    it('should process supplier data first', async () => {
      const parameter: GetHotelsParameterDTO = {};
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      await service.getHotels(parameter);

      expect(mockSuppliersService.processData).toHaveBeenCalledTimes(1);
      expect(mockSuppliersService.processData).toHaveBeenCalledWith();
    });

    it('should return all hotels when no parameters provided', async () => {
      const parameter: GetHotelsParameterDTO = {};
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {},
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(mockHotelTransformer.toDTO).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockHotelDTOs);
    });

    it('should filter hotels by destination_id', async () => {
      const parameter: GetHotelsParameterDTO = { destination_id: 5432 };
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        { destination: 5432 },
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(result).toEqual(mockHotelDTOs);
    });

    it('should filter hotels by hotel_ids', async () => {
      const parameter: GetHotelsParameterDTO = {
        hotel_ids: ['hotel1', 'hotel2'],
      };
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {
          id: {
            $in: ['hotel1', 'hotel2'],
          },
        },
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(result).toEqual(mockHotelDTOs);
    });

    it('should filter hotels by both destination_id and hotel_ids', async () => {
      const parameter: GetHotelsParameterDTO = {
        destination_id: 5432,
        hotel_ids: ['hotel1'],
      };
      mockHotelRepository.find.mockResolvedValue([mockHotels[0]]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {
          destination: 5432,
          id: {
            $in: ['hotel1'],
          },
        },
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockHotelDTOs[0]);
    });

    it('should return empty array when no hotels found', async () => {
      const parameter: GetHotelsParameterDTO = { destination_id: 9999 };
      mockHotelRepository.find.mockResolvedValue([]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        { destination: 9999 },
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(result).toEqual([]);
      expect(mockHotelTransformer.toDTO).not.toHaveBeenCalled();
    });

    it('should handle empty hotel_ids array', async () => {
      const parameter: GetHotelsParameterDTO = { hotel_ids: [] };
      mockHotelRepository.find.mockResolvedValue([]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {
          id: {
            $in: [],
          },
        },
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(result).toEqual([]);
    });

    it('should handle single hotel_id', async () => {
      const parameter: GetHotelsParameterDTO = { hotel_ids: ['hotel1'] };
      mockHotelRepository.find.mockResolvedValue([mockHotels[0]]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {
          id: {
            $in: ['hotel1'],
          },
        },
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockHotelDTOs[0]);
    });

    it('should transform each hotel using HotelTransformer', async () => {
      const parameter: GetHotelsParameterDTO = {};
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelTransformer.toDTO).toHaveBeenCalledTimes(2);
      expect(mockHotelTransformer.toDTO).toHaveBeenCalledWith(mockHotels[0]);
      expect(mockHotelTransformer.toDTO).toHaveBeenCalledWith(mockHotels[1]);
      expect(result).toEqual(mockHotelDTOs);
    });

    it('should populate amenities and destination relations', async () => {
      const parameter: GetHotelsParameterDTO = {};
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {},
        {
          populate: ['amenities', 'destination'],
        },
      );
    });

    it('should handle repository errors', async () => {
      const parameter: GetHotelsParameterDTO = {};
      const error = new Error('Database connection failed');
      mockHotelRepository.find.mockRejectedValue(error);

      await expect(service.getHotels(parameter)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockSuppliersService.processData).toHaveBeenCalledTimes(1);
      expect(mockHotelTransformer.toDTO).not.toHaveBeenCalled();
    });

    it('should handle supplier service errors', async () => {
      const parameter: GetHotelsParameterDTO = {};
      const error = new Error('Supplier processing failed');
      mockSuppliersService.processData.mockRejectedValue(error);

      await expect(service.getHotels(parameter)).rejects.toThrow(
        'Supplier processing failed',
      );
      expect(mockSuppliersService.processData).toHaveBeenCalledTimes(1);
      expect(mockHotelRepository.find).not.toHaveBeenCalled();
    });

    it('should handle transformer errors', async () => {
      const parameter: GetHotelsParameterDTO = {};
      mockHotelRepository.find.mockResolvedValue(mockHotels);
      mockHotelTransformer.toDTO.mockImplementation(() => {
        throw new Error('Transformation failed');
      });

      await expect(service.getHotels(parameter)).rejects.toThrow(
        'Transformation failed',
      );
    });

    it('should handle large datasets', async () => {
      const parameter: GetHotelsParameterDTO = {};
      const largeHotelsList = Array.from({ length: 10000 }, (_, i) => ({
        ...mockHotels[0],
        id: `hotel${i}`,
      }));
      mockHotelRepository.find.mockResolvedValue(largeHotelsList as unknown as Hotel[]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledTimes(1);
      expect(mockHotelTransformer.toDTO).toHaveBeenCalledTimes(10000);
      expect(result).toHaveLength(10000);
    });

    it('should handle concurrent calls', async () => {
      const parameter1: GetHotelsParameterDTO = { destination_id: 5432 };
      const parameter2: GetHotelsParameterDTO = { hotel_ids: ['hotel1'] };
      
      mockHotelRepository.find
        .mockResolvedValueOnce([mockHotels[0]])
        .mockResolvedValueOnce([mockHotels[1]]);

      const [result1, result2] = await Promise.all([
        service.getHotels(parameter1),
        service.getHotels(parameter2),
      ]);

      expect(mockSuppliersService.processData).toHaveBeenCalledTimes(2);
      expect(mockHotelRepository.find).toHaveBeenCalledTimes(2);
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
    });
  });

  describe('error scenarios', () => {
    beforeEach(() => {
      mockSuppliersService.processData.mockResolvedValue([] as any);
    });

    it('should handle undefined parameters', async () => {
      const parameter: GetHotelsParameterDTO = {
        destination_id: undefined,
        hotel_ids: undefined,
      };
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {},
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(result).toEqual(mockHotelDTOs);
    });

    it('should handle null hotel results from repository', async () => {
      const parameter: GetHotelsParameterDTO = {};
      mockHotelRepository.find.mockResolvedValue(null as any);

      await expect(service.getHotels(parameter)).rejects.toThrow();
    });

    it('should handle hotels without amenities', async () => {
      const parameter: GetHotelsParameterDTO = {};
      const hotelWithoutAmenities = {
        ...mockHotels[0],
        amenities: {
          getItems: () => [],
          add: jest.fn(),
        } as unknown as Collection<Amenity>,
      };
      mockHotelRepository.find.mockResolvedValue([hotelWithoutAmenities] as unknown as Hotel[]);

      const result = await service.getHotels(parameter);

      expect(result).toHaveLength(1);
      expect(mockHotelTransformer.toDTO).toHaveBeenCalledWith(hotelWithoutAmenities);
    });

    it('should handle special characters in hotel_ids', async () => {
      const parameter: GetHotelsParameterDTO = {
        hotel_ids: ['hotel-1', 'hotel_2', 'hotel.3', 'hotel@4'],
      };
      mockHotelRepository.find.mockResolvedValue([]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {
          id: {
            $in: ['hotel-1', 'hotel_2', 'hotel.3', 'hotel@4'],
          },
        },
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(result).toEqual([]);
    });

    it('should handle very large hotel_ids array', async () => {
      const largeHotelIds = Array.from({ length: 10000 }, (_, i) => `hotel${i}`);
      const parameter: GetHotelsParameterDTO = { hotel_ids: largeHotelIds };
      mockHotelRepository.find.mockResolvedValue([]);

      const result = await service.getHotels(parameter);

      expect(mockHotelRepository.find).toHaveBeenCalledWith(
        {
          id: {
            $in: largeHotelIds,
          },
        },
        {
          populate: ['amenities', 'destination'],
        },
      );
      expect(result).toEqual([]);
    });
  });

  describe('integration with dependencies', () => {
    beforeEach(() => {
      mockSuppliersService.processData.mockResolvedValue([] as any);
      mockHotelTransformer.toDTO = jest.fn().mockReturnValue(mockHotelDTOs[0]);
    });

    it('should maintain correct order of operations', async () => {
      const parameter: GetHotelsParameterDTO = {};
      mockHotelRepository.find.mockResolvedValue(mockHotels);

      await service.getHotels(parameter);

      // Verify order: suppliers first, then repository, then transformation
      const processDataCall = mockSuppliersService.processData.mock.invocationCallOrder[0];
      const findCall = mockHotelRepository.find.mock.invocationCallOrder[0];
      const toDTOCall = mockHotelTransformer.toDTO.mock.invocationCallOrder[0];

      expect(processDataCall).toBeLessThan(findCall);
      expect(findCall).toBeLessThan(toDTOCall);
    });

    it('should not call repository if supplier processing fails', async () => {
      const parameter: GetHotelsParameterDTO = {};
      mockSuppliersService.processData.mockRejectedValue(new Error('Supplier failed'));

      await expect(service.getHotels(parameter)).rejects.toThrow('Supplier failed');
      expect(mockHotelRepository.find).not.toHaveBeenCalled();
    });

    it('should not call transformer if repository fails', async () => {
      const parameter: GetHotelsParameterDTO = {};
      mockHotelRepository.find.mockRejectedValue(new Error('Repository failed'));

      await expect(service.getHotels(parameter)).rejects.toThrow('Repository failed');
      expect(mockHotelTransformer.toDTO).not.toHaveBeenCalled();
    });
  });
});
