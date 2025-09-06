import { Hotel } from 'src/db/entities/hotel.entity';

export interface SupplierExtractorStrategy {
  fetchData(): Promise<Hotel[]>;
}
