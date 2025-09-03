import { Migration } from '@mikro-orm/migrations';

export class Migration20250903155429 extends Migration {
  override up(): void {
    this.addSql(
      `create table "amenity" ("id" serial primary key, "name" varchar(255) not null, "category" varchar(255) not null, "synonyms" text[] not null);`,
    );

    this.addSql(
      `create table "destination" ("id" varchar(255) not null, "country" varchar(255) not null, "city" varchar(255) not null, constraint "destination_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "supplier" ("id" serial primary key, "name" varchar(255) not null, "source_url" varchar(255) not null, "property_mapping" jsonb null);`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "amenity" cascade;`);

    this.addSql(`drop table if exists "destination" cascade;`);

    this.addSql(`drop table if exists "supplier" cascade;`);
  }
}
