import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';

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
}
