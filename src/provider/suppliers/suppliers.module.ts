import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Supplier } from 'src/db/entities/supplier.entity';
import { Hotel } from 'src/db/entities/hotel.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Supplier, Hotel])],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
