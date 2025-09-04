import { Injectable } from '@nestjs/common';
import { GetHotelsParameterDTO } from './hotels.schema';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Hotel } from 'src/db/entities/hotel.entity';
import { HotelRepository } from 'src/db/entities/repositories/hotel.repository';
import { FilterQuery } from '@mikro-orm/core';
import { SuppliersService } from 'src/provider/suppliers/suppliers.service';

@Injectable()
export class HotelsService {
  constructor(
    private readonly supplierSerivice: SuppliersService,

    @InjectRepository(Hotel)
    private readonly hotelRepository: HotelRepository,
  ) {}

  async getHotels(parameter: GetHotelsParameterDTO) {
    await this.supplierSerivice.processData();

    const filter: FilterQuery<Hotel> = {};

    if (parameter.destination_id) {
      filter.destination = parameter.destination_id;
    }

    if (parameter.hotel_ids) {
      filter.id = {
        $in: parameter.hotel_ids,
      };
    }

    const hotels = await this.hotelRepository.find(filter, {
      populate: ['amenities', 'destination'],
    });

    return hotels;
  }
}
