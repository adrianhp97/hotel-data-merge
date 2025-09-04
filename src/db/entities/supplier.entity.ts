import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { SupplierRepository } from './repositories/supplier.repository';

@Entity({
  repository: () => SupplierRepository,
})
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
