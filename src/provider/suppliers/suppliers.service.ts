import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { SuppliersStrategy } from './suppliers.strategy';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly em: SqlEntityManager,
    private readonly supplierStrategy: SuppliersStrategy,
  ) {}

  async processData() {
    return this.supplierStrategy.fetchData();
  }
}
