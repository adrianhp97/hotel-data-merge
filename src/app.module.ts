import { Module } from '@nestjs/common';

import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from 'mikro-orm.config';
import { ApiModule } from 'src/api/api.module';
import { ProviderModule } from 'src/provider/provider.module';

@Module({
  imports: [MikroOrmModule.forRoot(config), ApiModule, ProviderModule],
})
export class AppModule {}
