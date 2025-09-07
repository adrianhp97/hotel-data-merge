import { Injectable, Inject } from '@nestjs/common';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Hotel } from 'src/db/entities/hotel.entity';
import { Destination } from 'src/db/entities/destination.entity';
import { Amenity, AmenityCategory } from 'src/db/entities/amenity.entity';
import supplierConfig from 'src/config/supplier.config';
import { ConfigType } from '@nestjs/config';
import { SupplierExtractorStrategy } from '../suppliers.interface';
import {
  getArrayMap,
  mergeArrayByKey,
  sortByLengthAndLexicographically,
} from 'src/utils/array';
import { getLongestString } from 'src/utils/string';
import { UNDEFINED_DESTINATION_LABEL } from 'src/constants/common';

type ImageRaw = {
  link: string;
  caption: string;
};

type HotelRaw = {
  hotel_id: string;
  destination_id: number;
  hotel_name: string;
  location: {
    address: string;
    country: string;
  };
  details: string;
  amenities: Partial<{
    general: string[];
    room: string[];
  }>;
  images: Partial<{
    rooms: ImageRaw[];
    site: ImageRaw[];
  }>;
  booking_conditions: string[];
};

@Injectable()
export class PaperfliesStrategy implements SupplierExtractorStrategy {
  private readonly config: ConfigType<typeof supplierConfig>['paperflies'];

  constructor(
    @Inject(supplierConfig.KEY)
    readonly supConfig: ConfigType<typeof supplierConfig>,
    private readonly em: SqlEntityManager,
  ) {
    this.config = this.supConfig.paperflies;
  }

  async fetchData(): Promise<Hotel[]> {
    const em = this.em.fork(); // single fork for entire operation

    return em.transactional(async (em) => {
      const rawHotels = await this.extract();
      const cleanedHotels = await Promise.all(
        rawHotels.map((raw) => this.transform(raw, em)),
      );
      return this.loads(cleanedHotels, em);
    });
  }

  async extract(): Promise<HotelRaw[]> {
    const response = await fetch(this.config.host ?? '');
    return (await response.json()) as HotelRaw[];
  }

  async transform(rawHotel: HotelRaw, em: SqlEntityManager): Promise<Hotel> {
    // --- Upsert Destination ---
    let destination = await em.findOne(Destination, rawHotel.destination_id);
    if (!destination) {
      destination = em.create(Destination, {
        id: rawHotel.destination_id,
        country: rawHotel.location.country.trim(),
        city: UNDEFINED_DESTINATION_LABEL,
      });
    } else {
      destination.country = rawHotel.location.country.trim();
    }
    em.persist(destination);

    // --- Upsert Hotel ---
    let hotel: Hotel | null = await em.findOne(Hotel, rawHotel.hotel_id, {
      populate: ['destination', 'amenities'],
    });

    if (!hotel) {
      hotel = em.create(Hotel, {
        id: rawHotel.hotel_id,
        destination,
        name: rawHotel.hotel_name.trim(),
        description: rawHotel.details.trim(),
        location: {
          address: rawHotel.location.address.trim(),
          city: destination.city,
          country: destination.country,
        },
        booking_conditions: rawHotel.booking_conditions.map((c) => c.trim()),
      });
    } else {
      hotel.name = getLongestString(hotel.name, rawHotel.hotel_name.trim());
      hotel.description = getLongestString(
        hotel.description ?? '',
        rawHotel.details.trim(),
      );
      hotel.destination = destination;
      hotel.location = {
        address: rawHotel.location.address.trim(),
        city: destination.city,
        country: destination.country,
        ...(hotel.location ?? {}),
      };
      hotel.booking_conditions = rawHotel.booking_conditions.map((c) =>
        c.trim(),
      );
    }

    // --- Merge Images ---
    hotel.images = hotel.images ?? {};
    hotel.images.site = mergeArrayByKey(
      hotel.images.site ?? [],
      rawHotel.images.site?.map((i) => ({
        link: i.link.trim(),
        description: i.caption.trim(),
      })) ?? [],
      'link',
    );
    hotel.images.rooms = mergeArrayByKey(
      hotel.images.rooms ?? [],
      rawHotel.images.rooms?.map((i) => ({
        link: i.link.trim(),
        description: i.caption.trim(),
      })) ?? [],
      'link',
    );

    // --- Merge Amenities ---
    const rawAmenitiesForGeneral = sortByLengthAndLexicographically(
      rawHotel.amenities.general?.map((f) => f.toLowerCase().trim()) ?? [],
    );
    const rawAmenitiesForRoom = sortByLengthAndLexicographically(
      rawHotel.amenities.room?.map((f) => f.toLowerCase().trim()) ?? [],
    );

    const allRawAmenities = [...rawAmenitiesForGeneral, ...rawAmenitiesForRoom];
    const existingAmenities = await em.find(Amenity, {
      name: { $in: allRawAmenities },
    });
    const amenitiesMap = getArrayMap(existingAmenities, 'name');

    for (const [raws, category] of [
      [rawAmenitiesForGeneral, 'general'],
      [rawAmenitiesForRoom, 'room'],
    ]) {
      for (const name of raws) {
        let amenity = amenitiesMap.get(name);
        if (!amenity) {
          amenity = em.create(Amenity, {
            name,
            category: category as AmenityCategory,
            synonyms: [],
          });
          amenitiesMap.set(name, amenity);
        }
        amenity.category = category as AmenityCategory;
        hotel.amenities.add(amenity);
        em.persist(amenity);
      }
    }

    em.persist(hotel);
    return hotel;
  }

  async loads(data: Hotel[], em: SqlEntityManager): Promise<Hotel[]> {
    const results: Hotel[] = [];
    for (const hotel of data) {
      await em.flush();
      results.push(hotel);
    }
    return results;
  }
}
