import { Injectable } from '@nestjs/common';
import { GetHotelsParameterDTO } from './hotels.schema';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Hotel } from 'src/db/entities/hotel.entity';
import { HotelRepository } from 'src/db/entities/repositories/hotel.repository';
import { FilterQuery } from '@mikro-orm/core';
import { SuppliersService } from 'src/provider/suppliers/suppliers.service';
import { HotelDTO } from 'src/dto/hotel.dto';
import { HotelTransformer } from 'src/transformers/hotel.transformer';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from 'src/dto/paginated-response.dto';

@Injectable()
export class HotelsService {
  constructor(
    private readonly supplierSerivice: SuppliersService,

    @InjectRepository(Hotel)
    private readonly hotelRepository: HotelRepository,
  ) {}

  async getHotels(
    parameter: GetHotelsParameterDTO,
  ): Promise<PaginatedResponse<HotelDTO>> {
    const filter: FilterQuery<Hotel> = {};

    console.log('parameter', parameter);

    if (parameter.destination_id) {
      filter.destination = parameter.destination_id;
    }

    if (parameter.hotel_ids) {
      filter.id = {
        $in: parameter.hotel_ids,
      };
    }

    // Calculate offset for pagination
    const offset = (parameter.page - 1) * parameter.limit;

    // Get total count for pagination metadata
    const total = await this.hotelRepository.count(filter);

    // Get paginated hotels
    const hotels = await this.hotelRepository.find(filter, {
      populate: ['amenities', 'destination'],
      limit: parameter.limit,
      offset: offset,
    });

    const hotelDTOs = hotels.map((hotel) => HotelTransformer.toDTO(hotel));

    return createPaginatedResponse(
      hotelDTOs,
      total,
      parameter.page,
      parameter.limit,
    );
  }
}
