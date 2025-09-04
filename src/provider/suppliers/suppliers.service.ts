import { InjectRepository } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Hotel } from 'src/db/entities/hotel.entity';
import { HotelRepository } from 'src/db/entities/repositories/hotel.repository';
import { SupplierRepository } from 'src/db/entities/repositories/supplier.repository';
import { Supplier } from 'src/db/entities/supplier.entity';
import { mapObject } from 'src/utils/object';

type TransformPayload = {
  information: object;
  supplier: Supplier;
};

@Injectable()
export class SuppliersService {
  constructor(
    private readonly em: SqlEntityManager,

    @InjectRepository(Supplier)
    private readonly supplierRepository: SupplierRepository,

    @InjectRepository(Hotel)
    private readonly hotelRepository: HotelRepository,
  ) {}

  async processData() {
    const suppliers = await this.supplierRepository.findAll();

    const data = await Promise.all(
      suppliers.map((supplier) => this._extract(supplier)),
    );

    const transformPayload: TransformPayload[] = [];
    for (let idx = 0; idx < suppliers.length; idx++) {
      transformPayload.push({
        information: data[idx] ?? {},
        supplier: suppliers[idx],
      });
    }
  }

  async _extract(supplier: Supplier) {
    const response = await fetch(supplier.source_url);

    const data = (await response.json()) as object;

    return data;
  }

  _transform(data: TransformPayload[]) {
    const result = data.map(({ information, supplier }) =>
      mapObject(information, supplier.property_mapping),
    );

    console.log(result);

    // TODO: merge hotel
    const hotel = {} as Hotel;

    return hotel;
  }

  async _load(hotel: Hotel) {
    const em = this.em.fork();

    this.hotelRepository.create(hotel);

    await em.flush();

    return hotel;
  }
}
