import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'src/pipes/zod.pipe';
import {
  GetHotelsParameterDTO,
  getHotelsParameterSchema,
} from './hotels.schema';
import { HotelsService } from './hotels.service';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelService: HotelsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(getHotelsParameterSchema))
  async getHotels(@Query() query: GetHotelsParameterDTO) {
    // TODO: Pagination
    const hotels = await this.hotelService.getHotels(query);

    return hotels;
  }
}
