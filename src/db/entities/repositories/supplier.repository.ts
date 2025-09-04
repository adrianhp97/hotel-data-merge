import { EntityRepository } from '@mikro-orm/postgresql';
import { Supplier } from '../supplier.entity';

export class SupplierRepository extends EntityRepository<Supplier> {}
