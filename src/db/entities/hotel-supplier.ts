import { BaseEntity, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Hotel } from './hotel.entity';

export type Supplier = 'acme' | 'paperflies' | 'patagonia';

@Entity()
export class HotelSupplier extends BaseEntity {
  @ManyToOne({ primary: true })
  hotel: Hotel;

  @Property({ primary: true, type: 'string' })
  supplier!: Supplier;
}
