import { Migration } from '@mikro-orm/migrations';

export class Migration20250904150356 extends Migration {
  override up(): void {
    this.addSql(
      `create table "hotel" ("id" varchar(255) not null, "destination_id" varchar(255) not null, "name" varchar(255) not null, "location" jsonb not null, "description" varchar(255) null, "images" jsonb null, "booking_conditions" text[] null, "created_at" timestamptz null, "updated_at" timestamptz null, constraint "hotel_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "hotel_amenities" ("hotel_id" varchar(255) not null, "amenity_id" int not null, constraint "hotel_amenities_pkey" primary key ("hotel_id", "amenity_id"));`,
    );

    this.addSql(
      `alter table "hotel" add constraint "hotel_destination_id_foreign" foreign key ("destination_id") references "destination" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "hotel_amenities" add constraint "hotel_amenities_hotel_id_foreign" foreign key ("hotel_id") references "hotel" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "hotel_amenities" add constraint "hotel_amenities_amenity_id_foreign" foreign key ("amenity_id") references "amenity" ("id") on update cascade on delete cascade;`,
    );
  }

  override down(): void {
    this.addSql(
      `alter table "hotel_amenities" drop constraint "hotel_amenities_hotel_id_foreign";`,
    );

    this.addSql(`drop table if exists "hotel" cascade;`);

    this.addSql(`drop table if exists "hotel_amenities" cascade;`);
  }
}
