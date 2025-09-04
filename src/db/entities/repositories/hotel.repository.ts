import { EntityRepository } from '@mikro-orm/postgresql';
import { Hotel } from '../hotel.entity';

export class HotelRepository extends EntityRepository<Hotel> {}
