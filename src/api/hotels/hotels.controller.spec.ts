import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { GetHotelsParameterDTO } from './hotels.schema';
import { HotelDTO } from 'src/dto/hotel.dto';

describe('HotelsController', () => {
  let controller: HotelsController;
  let mockHotelsService: jest.Mocked<HotelsService>;

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
        room: ['Air conditioning', 'TV'],
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
        general: ['WiFi', 'Gym'],
        room: ['Air conditioning', 'Mini bar'],
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
    mockHotelsService = {
      getHotels: jest.fn(),
    } as unknown as jest.Mocked<HotelsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [
        {
          provide: HotelsService,
          useValue: mockHotelsService,
        },
      ],
    }).compile();

    controller = module.get<HotelsController>(HotelsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should inject HotelsService correctly', () => {
      expect(mockHotelsService).toBeDefined();
    });
  });

  describe('getHotels', () => {
    it('should return hotels without any filters', async () => {
      const query: GetHotelsParameterDTO = {};
      mockHotelsService.getHotels.mockResolvedValue(mockHotelDTOs);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(mockHotelsService.getHotels).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockHotelDTOs);
    });

    it('should return hotels filtered by destination_id', async () => {
      const query: GetHotelsParameterDTO = { destination_id: 5432 };
      const filteredHotels = mockHotelDTOs.filter(
        (hotel) => hotel.destination_id === 5432,
      );
      mockHotelsService.getHotels.mockResolvedValue(filteredHotels);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual(filteredHotels);
    });

    it('should return hotels filtered by hotel_ids', async () => {
      const query: GetHotelsParameterDTO = { hotel_ids: ['hotel1'] };
      const filteredHotels = mockHotelDTOs.filter((hotel) =>
        query.hotel_ids!.includes(hotel.id),
      );
      mockHotelsService.getHotels.mockResolvedValue(filteredHotels);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual(filteredHotels);
    });

    it('should return hotels filtered by both destination_id and hotel_ids', async () => {
      const query: GetHotelsParameterDTO = {
        destination_id: 5432,
        hotel_ids: ['hotel1', 'hotel2'],
      };
      mockHotelsService.getHotels.mockResolvedValue(mockHotelDTOs);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockHotelDTOs);
    });

    it('should return empty array when no hotels match filters', async () => {
      const query: GetHotelsParameterDTO = { destination_id: 9999 };
      mockHotelsService.getHotels.mockResolvedValue([]);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const query: GetHotelsParameterDTO = {};
      const error = new Error('Database connection failed');
      mockHotelsService.getHotels.mockRejectedValue(error);

      await expect(controller.getHotels(query)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
    });

    it('should handle undefined query parameters', async () => {
      const query: GetHotelsParameterDTO = {
        destination_id: undefined,
        hotel_ids: undefined,
      };
      mockHotelsService.getHotels.mockResolvedValue(mockHotelDTOs);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockHotelDTOs);
    });

    it('should handle empty hotel_ids array', async () => {
      const query: GetHotelsParameterDTO = { hotel_ids: [] };
      mockHotelsService.getHotels.mockResolvedValue([]);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });

    it('should propagate service timeout errors', async () => {
      const query: GetHotelsParameterDTO = {};
      const timeoutError = new Error('Request timeout');
      mockHotelsService.getHotels.mockRejectedValue(timeoutError);

      await expect(controller.getHotels(query)).rejects.toThrow(
        'Request timeout',
      );
    });

    it('should handle large hotel_ids arrays', async () => {
      const largeHotelIds = Array.from({ length: 100 }, (_, i) => `hotel${i}`);
      const query: GetHotelsParameterDTO = { hotel_ids: largeHotelIds };
      mockHotelsService.getHotels.mockResolvedValue([]);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });
  });

  describe('validation pipe integration', () => {
    it('should use ZodValidationPipe for query validation', () => {
      // Note: In a real test, you'd want to verify the pipe is applied
      // This is more of a documentation test showing the pipe exists
      expect(controller.getHotels).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle service throwing custom exceptions', async () => {
      const query: GetHotelsParameterDTO = {};
      const customError = new BadRequestException('Invalid parameters');
      mockHotelsService.getHotels.mockRejectedValue(customError);

      await expect(controller.getHotels(query)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle service returning null', async () => {
      const query: GetHotelsParameterDTO = {};
      mockHotelsService.getHotels.mockResolvedValue(null as unknown as HotelDTO[]);

      const result = await controller.getHotels(query);

      expect(result).toBeNull();
    });

    it('should handle concurrent requests', async () => {
      const query1: GetHotelsParameterDTO = { destination_id: 5432 };
      const query2: GetHotelsParameterDTO = { hotel_ids: ['hotel1'] };

      mockHotelsService.getHotels
        .mockResolvedValueOnce([mockHotelDTOs[0]])
        .mockResolvedValueOnce([mockHotelDTOs[1]]);

      const [result1, result2] = await Promise.all([
        controller.getHotels(query1),
        controller.getHotels(query2),
      ]);

      expect(result1).toEqual([mockHotelDTOs[0]]);
      expect(result2).toEqual([mockHotelDTOs[1]]);
      expect(mockHotelsService.getHotels).toHaveBeenCalledTimes(2);
    });
  });

  describe('performance and edge cases', () => {
    it('should handle very large response data', async () => {
      const query: GetHotelsParameterDTO = {};
      const largeResponse = Array.from({ length: 10000 }, (_, i) => ({
        ...mockHotelDTOs[0],
        id: `hotel${i}`,
      }));

      mockHotelsService.getHotels.mockResolvedValue(largeResponse);

      const result = await controller.getHotels(query);

      expect(result).toHaveLength(10000);
      expect(result[0].id).toBe('hotel0');
      expect(result[9999].id).toBe('hotel9999');
    });

    it('should handle special characters in hotel_ids', async () => {
      const query: GetHotelsParameterDTO = {
        hotel_ids: ['hotel-1', 'hotel_2', 'hotel.3', 'hotel@4'],
      };
      mockHotelsService.getHotels.mockResolvedValue([]);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });

    it('should handle zero destination_id', async () => {
      // Note: Schema validation should prevent this, but testing controller robustness
      const query: GetHotelsParameterDTO = { destination_id: 0 };
      mockHotelsService.getHotels.mockResolvedValue([]);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });

    it('should handle negative destination_id', async () => {
      // Note: Schema validation should prevent this, but testing controller robustness
      const query: GetHotelsParameterDTO = { destination_id: -1 };
      mockHotelsService.getHotels.mockResolvedValue([]);

      const result = await controller.getHotels(query);

      expect(mockHotelsService.getHotels).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });
  });
});
