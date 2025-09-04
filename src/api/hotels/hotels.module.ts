import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { SuppliersService } from 'src/provider/suppliers/suppliers.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Hotel } from 'src/db/entities/hotel.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Hotel]), SuppliersService],
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
