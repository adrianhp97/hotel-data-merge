import {
  BaseEntity,
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Hotel } from './hotel.entity';

export type AmenityCategory = 'general' | 'room';

@Entity({})
export class Amenity extends BaseEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'string' })
  category!: AmenityCategory;

  @Property({ type: 'string[]' })
  synonyms: string[];

  @ManyToMany(() => Hotel, (hotel) => hotel.amenities)
  hotels = new Collection<Hotel>(this);
}
