import { Injectable } from '@nestjs/common';
import { AcmeStrategy } from './strategy/acme.strategy';
import { PaperfliesStrategy } from './strategy/paperflies.strategy';
import { PatagoniaStrategy } from './strategy/patagonia.strategy';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { SupplierExtractorStrategy } from './suppliers.interface';

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
    return Promise.allSettled(
      ['acme', 'paperflies', 'patagonia'].map((supplier) =>
        this.processSuplier(supplier as Supplier),
      ),
    );
  }

  async processSuplier(supplier: Supplier) {
    if (this.startegyMap.has(supplier)) {
      console.log(this.startegyMap.get(supplier)?.fetchData());
      return this.startegyMap.get(supplier)?.fetchData();
    }
    throw new Error('Supplier not found');
  }
}
