import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({})
export class Destination extends BaseEntity {
  @PrimaryKey()
  id!: string;

  @Property()
  country!: string;

  @Property()
  city!: string;
}
