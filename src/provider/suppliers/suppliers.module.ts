import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Hotel } from 'src/db/entities/hotel.entity';
import { ConfigModule } from '@nestjs/config';
import supplierConfig from 'src/config/supplier.config';
import { AcmeStrategy } from './strategy/acme.strategy';
import { PaperfliesStrategy } from './strategy/paperflies.strategy';
import { PatagoniaStrategy } from './strategy/patagonia.strategy';
import { SuppliersStrategy } from './suppliers.strategy';

@Module({
  imports: [
    MikroOrmModule.forFeature([Hotel]),
    ConfigModule.forFeature(supplierConfig),
  ],
  providers: [
    SuppliersService,
    SuppliersStrategy,

    // Extractor Strategy
    AcmeStrategy,
    PaperfliesStrategy,
    PatagoniaStrategy,
  ],
  exports: [SuppliersService],
})
export class SuppliersModule {}
