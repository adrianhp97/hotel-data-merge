import { Injectable } from '@nestjs/common';
import { AcmeStrategy } from './strategy/acme.strategy';
import { PaperfliesStrategy } from './strategy/paperflies.strategy';
import { PatagoniaStrategy } from './strategy/patagonia.strategy';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { SupplierExtractorStrategy } from './suppliers.interface';
import { Hotel } from 'src/db/entities/hotel.entity';
import { Supplier } from 'src/db/entities/hotel-supplier';

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
    const allResult = await Promise.allSettled(result);

    await this.cleanUpHotels();

    return allResult;
  }

  async processSuplier(supplier: Supplier) {
    if (this.startegyMap.has(supplier)) {
      return this.startegyMap.get(supplier)?.fetchData();
    }
    throw new Error('Supplier not found');
  }

  async cleanUpHotels(): Promise<number> {
    const em = this.em.fork();

    return em.transactional(async (em) => {
      const hotelsToDelete = await em
        .createQueryBuilder(Hotel, 'h')
        .leftJoin('h.suppliers', 's')
        .where('s.supplier IS NULL')
        .getResultList();

      if (hotelsToDelete.length === 0) {
        return 0;
      }

      const hotelIds = hotelsToDelete.map((hotel) => hotel.id);

      const deletedCount = await em.nativeDelete(Hotel, {
        id: { $in: hotelIds },
      });

      return deletedCount;
    });
  }
}
