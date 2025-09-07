import {
  BaseEntity,
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Destination } from './destination.entity';
import { Amenity } from './amenity.entity';
import { HotelRepository } from './repositories/hotel.repository';

export type HotelLocation = {
  lat?: number;
  lng?: number;
  address?: string;
  city?: string;
  country?: string;
};

export type HotelImageCategory = 'rooms' | 'site' | 'amenities';
export type HotelImage = {
  link: string;
  description: string;
};

@Entity({
  repository: () => HotelRepository,
})
export class Hotel extends BaseEntity {
  @PrimaryKey()
  id!: string;

  @ManyToOne()
  destination: Destination;

  @Property()
  name: string;

  @Property({ type: 'json' })
  location: HotelLocation;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Amenity, (amenity) => amenity.hotels, {
    owner: true,
    pivotTable: 'hotel_amenities',
  })
  amenities = new Collection<Amenity>(this);

  @Property({ type: 'json', nullable: true })
  images?: Partial<Record<HotelImageCategory, HotelImage[]>> = {};

  @Property({ type: 'string[]', nullable: true })
  booking_conditions?: string[];

  @Property()
  created_at? = new Date();

  @Property({ onUpdate: () => new Date() })
  updated_at? = new Date();
}
