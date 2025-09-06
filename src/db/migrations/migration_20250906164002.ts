import { Migration } from '@mikro-orm/migrations';

export class Migration20250906164002 extends Migration {
  override up(): void {
    this.addSql(
      `create table "amenity" ("id" serial primary key, "name" varchar(255) not null, "category" varchar(255) not null, "synonyms" text[] not null);`,
    );

    this.addSql(
      `create table "destination" ("id" int not null, "country" varchar(255) not null, "city" varchar(255) not null, constraint "destination_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "hotel" ("id" varchar(255) not null, "destination_id" int not null, "name" varchar(255) not null, "location" jsonb not null, "description" text null, "images" jsonb null, "booking_conditions" text[] null, "created_at" timestamptz null, "updated_at" timestamptz(3) null default current_timestamp(3), constraint "hotel_pkey" primary key ("id"));`,
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
      `alter table "hotel_amenities" drop constraint "hotel_amenities_amenity_id_foreign";`,
    );

    this.addSql(
      `alter table "hotel" drop constraint "hotel_destination_id_foreign";`,
    );

    this.addSql(
      `alter table "hotel_amenities" drop constraint "hotel_amenities_hotel_id_foreign";`,
    );

    this.addSql(`drop table if exists "amenity" cascade;`);

    this.addSql(`drop table if exists "destination" cascade;`);

    this.addSql(`drop table if exists "hotel" cascade;`);

    this.addSql(`drop table if exists "hotel_amenities" cascade;`);
  }
}
