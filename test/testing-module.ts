import { AnyEntity, EntityName, MikroORM } from '@mikro-orm/postgresql';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import config from '../mikro-orm.config';

export const createTestingModule = async ({
  entities,
  metadata,
}: {
  entities: EntityName<AnyEntity>[];
  metadata: ModuleMetadata;
}) => {
  const module = await Test.createTestingModule({
    imports: [
      ...(metadata?.imports ?? []),
      MikroOrmModule.forRoot({
        ...config,
        dbName: 'nest-mikro-test-db',
        allowGlobalContext: true,
      }),
      MikroOrmModule.forFeature(entities),
    ],
    ...metadata,
  }).compile();

  const orm = module.get(MikroORM);
  await orm.getSchemaGenerator().refreshDatabase();
  return { module, orm };
};
