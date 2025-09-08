import { Hotel } from 'src/db/entities/hotel.entity';
import { SupplierExtractorStrategy } from '../suppliers.interface';
import supplierConfig from 'src/config/supplier.config';
import { ConfigType } from '@nestjs/config';
import { Destination } from 'src/db/entities/destination.entity';
import { Inject, Injectable } from '@nestjs/common';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import {
  getArrayMap,
  mergeArrayByKey,
  sortByLengthAndLexicographically,
} from 'src/utils/array';
import { Amenity } from 'src/db/entities/amenity.entity';
import { getLongestString } from 'src/utils/string';
import { UNDEFINED_DESTINATION_LABEL } from 'src/constants/common';
import { HotelSupplier } from 'src/db/entities/hotel-supplier';

type ImageRaw = {
  url: string;
  description: string;
};

type HotelRaw = {
  id: string;
  destination: number;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  info: string;
  amenities?: string[];
  images: Partial<{
    rooms: ImageRaw[];
    amenities: ImageRaw[];
  }>;
};

@Injectable()
export class PatagoniaStrategy implements SupplierExtractorStrategy {
  private readonly config: ConfigType<typeof supplierConfig>['patagonia'];

  constructor(
    @Inject(supplierConfig.KEY)
    readonly supConfig: ConfigType<typeof supplierConfig>,

    private readonly em: SqlEntityManager,
  ) {
    this.config = this.supConfig.patagonia;
  }
  async fetchData(): Promise<Hotel[]> {
    const em = this.em.fork(); // single fork for entire operation

    return em.transactional(async (em) => {
      const rawHotels = await this.extract();
      const cleanedHotels = await Promise.all(
        rawHotels.map((raw) => this.transform(raw, em)),
      );
      await this.removedHotelsFromSupplier(cleanedHotels, em);
      return this.loads(cleanedHotels, em);
    });
  }

  async extract(): Promise<HotelRaw[]> {
    const response = await fetch(this.config.host ?? '');
    return (await response.json()) as HotelRaw[];
  }

  async transform(rawHotel: HotelRaw, em: SqlEntityManager): Promise<Hotel> {
    // --- Upsert Destination ---
    let destination = await em.findOne(Destination, rawHotel.destination);
    if (!destination) {
      destination = em.create(Destination, {
        id: rawHotel.destination,
        country: UNDEFINED_DESTINATION_LABEL,
        city: UNDEFINED_DESTINATION_LABEL,
      });
    }
    em.persist(destination);

    // --- Upsert Hotel ---
    let hotel: Hotel | null = await em.findOne(Hotel, rawHotel.id, {
      populate: ['destination', 'amenities'],
    });

    if (!hotel) {
      hotel = em.create(Hotel, {
        id: rawHotel.id,
        destination,
        name: rawHotel.name.trim(),
        location: {
          lat: rawHotel.lat,
          lng: rawHotel.lng,
          address: rawHotel.address?.trim(),
          city: destination.city,
          country: destination.country,
        },
      });
    } else {
      hotel.name = getLongestString(hotel.name, rawHotel.name.trim());
      hotel.destination = destination;
      hotel.location = {
        lat: rawHotel.lat,
        lng: rawHotel.lng,
        address: rawHotel.address?.trim(),
        city: destination.city,
        country: destination.country,
        ...(hotel.location ?? {}),
      };
    }

    // --- Merge Images ---
    hotel.images = hotel.images ?? {};
    hotel.images.amenities = mergeArrayByKey(
      hotel.images.amenities ?? [],
      rawHotel.images.amenities?.map((i) => ({
        link: i.url.trim(),
        description: i.description.trim(),
      })) ?? [],
      'link',
    );
    hotel.images.rooms = mergeArrayByKey(
      hotel.images.rooms ?? [],
      rawHotel.images.rooms?.map((i) => ({
        link: i.url.trim(),
        description: i.description.trim(),
      })) ?? [],
      'link',
    );

    // --- Upsert Amenities ---
    const rawAmenities = sortByLengthAndLexicographically(
      rawHotel.amenities?.map((f) => f.toLowerCase().trim()) ?? [],
    );
    const existingAmenities = await em.find(Amenity, {
      name: { $in: rawAmenities },
    });
    const amenitiesMap = getArrayMap(existingAmenities, 'name');

    for (const aName of rawAmenities) {
      let amenity = amenitiesMap.get(aName);
      if (!amenity) {
        amenity = em.create(Amenity, {
          name: aName,
          category: 'general',
          synonyms: [],
        });
        amenitiesMap.set(aName, amenity);
      }
      hotel?.amenities.add(amenity);
      em.persist(amenity);
    }

    em.persist(hotel);
    return hotel;
  }

  async loads(data: Hotel[], em: SqlEntityManager): Promise<Hotel[]> {
    const results: Hotel[] = [];
    
    // First, flush all hotels to ensure they exist in database
    await em.flush();
    
    // Then create supplier relationships
    for (const hotel of data) {
      const patagoniaSupplier = await em.upsert(HotelSupplier, {
        supplier: 'patagonia',
        hotel,
      });
      hotel.suppliers.add(patagoniaSupplier);
      results.push(hotel);
    }
    
    // Final flush for supplier relationships
    await em.flush();
    return results;
  }

  async removedHotelsFromSupplier(
    newHotels: Hotel[],
    em: SqlEntityManager,
  ): Promise<string[]> {
    const hotelIds = newHotels.map((h) => h.id);
    const hotelsNeedToBeRemoved = await em.find(HotelSupplier, {
      supplier: 'patagonia',
      hotel: { $nin: hotelIds },
    });

    const hotelIdsNeedToBeRemovedIds = hotelsNeedToBeRemoved.map(
      (hs) => hs.hotel.id,
    );

    for (const hs of hotelsNeedToBeRemoved) {
      em.remove(hs);
    }

    await em.flush();

    return hotelIdsNeedToBeRemovedIds;
  }
}
