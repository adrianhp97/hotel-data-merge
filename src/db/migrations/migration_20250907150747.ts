import { Migration } from '@mikro-orm/migrations';

export class Migration20250907150747 extends Migration {
  override up(): void {
    this.addSql(
      `create table "hotel_supplier" ("hotel_id" varchar(255) not null, "supplier" varchar(255) not null, constraint "hotel_supplier_pkey" primary key ("hotel_id", "supplier"));`,
    );

    this.addSql(
      `alter table "hotel_supplier" add constraint "hotel_supplier_hotel_id_foreign" foreign key ("hotel_id") references "hotel" ("id") on update cascade;`,
    );

    this.addSql(`alter table "hotel" alter column "updated_at" drop default;`);
    this.addSql(
      `alter table "hotel" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`,
    );
  }

  override down(): void {
    this.addSql(`drop table if exists "hotel_supplier" cascade;`);

    this.addSql(
      `alter table "hotel" alter column "updated_at" type timestamptz(3) using ("updated_at"::timestamptz(3));`,
    );
    this.addSql(
      `alter table "hotel" alter column "updated_at" set default current_timestamp(3);`,
    );
  }
}
