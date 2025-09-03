import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({})
export class Supplier extends BaseEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  source_url!: string;

  @Property({ type: 'json', nullable: true })
  property_mapping!: Record<string, string>;
}
