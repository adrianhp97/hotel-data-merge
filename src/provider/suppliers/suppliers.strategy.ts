import { Injectable } from '@nestjs/common';
import { AcmeStrategy } from './strategy/acme.strategy';
import { PaperfliesStrategy } from './strategy/paperflies.strategy';
import { PatagoniaStrategy } from './strategy/patagonia.strategy';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { SupplierExtractorStrategy } from './suppliers.interface';
import { Hotel } from 'src/db/entities/hotel.entity';

export type Supplier = 'acme' | 'paperflies' | 'patagonia';

@Injectable()
export class SuppliersStrategy {
  private readonly startegyMap: Map<Supplier, SupplierExtractorStrategy>;

  constructor(
    private readonly em: SqlEntityManager,

    private readonly acmeStrategy: AcmeStrategy,
    private readonly paperfliesStrategy: PaperfliesStrategy,
    private readonly patogoniaStrategy: PatagoniaStrategy,
  ) {
    this.startegyMap = new Map();

    this.startegyMap.set('acme', this.acmeStrategy);
    this.startegyMap.set('paperflies', this.paperfliesStrategy);
    this.startegyMap.set('patagonia', this.patogoniaStrategy);
  }

  async fetchData() {
    const result: Hotel[][] = [];
    for (const supplier of ['acme', 'paperflies', 'patagonia']) {
      const value = await this.processSuplier(supplier as Supplier);
      result.push(value ?? []);
    }
    return Promise.allSettled(result);
  }

  async processSuplier(supplier: Supplier) {
    if (this.startegyMap.has(supplier)) {
      return this.startegyMap.get(supplier)?.fetchData();
    }
    throw new Error('Supplier not found');
  }
}
