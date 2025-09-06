import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Hotel } from 'src/db/entities/hotel.entity';
import { SuppliersModule } from 'src/provider/suppliers/suppliers.module';

@Module({
  imports: [MikroOrmModule.forFeature([Hotel]), SuppliersModule],
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
