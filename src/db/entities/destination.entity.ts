import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({})
export class Destination extends BaseEntity {
  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property()
  country!: string;

  @Property()
  city!: string;
}
