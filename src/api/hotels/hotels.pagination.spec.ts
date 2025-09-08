import { Test, TestingModule } from '@nestjs/testing';
import { HotelsService } from './hotels.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Hotel } from 'src/db/entities/hotel.entity';
import { HotelRepository } from 'src/db/entities/repositories/hotel.repository';
import { SuppliersService } from 'src/provider/suppliers/suppliers.service';
import { GetHotelsParameterDTO } from './hotels.schema';
import { HotelTransformer } from 'src/transformers/hotel.transformer';

jest.mock('src/transformers/hotel.transformer');

describe('Hotels Pagination', () => {
  let service: HotelsService;
  let mockHotelRepository: jest.Mocked<HotelRepository>;
  let mockSuppliersService: jest.Mocked<SuppliersService>;

  beforeEach(async () => {
    mockHotelRepository = {
      find: jest.fn(),
      count: jest.fn(),
    } as any;

    mockSuppliersService = {
      processData: jest.fn(),
    } as any;

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

    // Mock transformer
    (HotelTransformer.toDTO as jest.Mock) = jest.fn().mockReturnValue({
      id: 'test-hotel',
      name: 'Test Hotel',
    });
  });

  it('should implement pagination correctly', async () => {
    const parameter: GetHotelsParameterDTO = { page: 2, limit: 5 };
    mockHotelRepository.count.mockResolvedValue(20);
    mockHotelRepository.find.mockResolvedValue([{ id: 'test' } as any]);

    const result = await service.getHotels(parameter);

    // Verify count query
    expect(mockHotelRepository.count).toHaveBeenCalledWith({});

    // Verify paginated query
    expect(mockHotelRepository.find).toHaveBeenCalledWith(
      {},
      {
        populate: ['amenities', 'destination'],
        limit: 5,
        offset: 5, // (page - 1) * limit = (2 - 1) * 5
      },
    );

    // Verify pagination metadata
    expect(result.pagination).toEqual({
      current_page: 2,
      per_page: 5,
      total: 20,
      total_pages: 4, // Math.ceil(20 / 5)
      has_next_page: true, // page 2 < 4 total pages
      has_previous_page: true, // page 2 > 1
    });

    expect(result.data).toBeDefined();
  });

  it('should use default pagination values', async () => {
    const parameter: GetHotelsParameterDTO = { page: 1, limit: 10 }; // Explicit pagination values
    mockHotelRepository.count.mockResolvedValue(5);
    mockHotelRepository.find.mockResolvedValue([]);

    const result = await service.getHotels(parameter);

    expect(mockHotelRepository.find).toHaveBeenCalledWith(
      {},
      {
        populate: ['amenities', 'destination'],
        limit: 10, // default limit
        offset: 0, // default page = 1
      },
    );

    expect(result.pagination).toEqual({
      current_page: 1, // default
      per_page: 10, // default
      total: 5,
      total_pages: 1,
      has_next_page: false,
      has_previous_page: false,
    });
  });

  it('should handle filtering with pagination', async () => {
    const parameter: GetHotelsParameterDTO = {
      destination_id: 123,
      hotel_ids: ['hotel1', 'hotel2'],
      page: 1,
      limit: 5,
    };
    mockHotelRepository.count.mockResolvedValue(2);
    mockHotelRepository.find.mockResolvedValue([]);

    await service.getHotels(parameter);

    // Verify both count and find use the same filter
    const expectedFilter = {
      destination: 123,
      id: { $in: ['hotel1', 'hotel2'] },
    };

    expect(mockHotelRepository.count).toHaveBeenCalledWith(expectedFilter);
    expect(mockHotelRepository.find).toHaveBeenCalledWith(expectedFilter, {
      populate: ['amenities', 'destination'],
      limit: 5,
      offset: 0,
    });
  });
});
