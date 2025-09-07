import { Injectable, Inject } from '@nestjs/common';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Hotel } from 'src/db/entities/hotel.entity';
import { Destination } from 'src/db/entities/destination.entity';
import { Amenity } from 'src/db/entities/amenity.entity';
import supplierConfig from 'src/config/supplier.config';
import { ConfigType } from '@nestjs/config';
import { SupplierExtractorStrategy } from '../suppliers.interface';
import { getArrayMap, sortByLengthAndLexicographically } from 'src/utils/array';
import { getLongestString } from 'src/utils/string';
import { HotelSupplier } from 'src/db/entities/hotel-supplier';

type HotelRaw = {
  Id: string;
  DestinationId: number;
  Name: string;
  Latitude: number;
  Longitude: number;
  Address: string;
  City: string;
  Country: string;
  PostalCode: string;
  Description: string;
  Facilities: string[];
};

@Injectable()
export class AcmeStrategy implements SupplierExtractorStrategy {
  private readonly config: ConfigType<typeof supplierConfig>['acme'];

  constructor(
    @Inject(supplierConfig.KEY)
    readonly supConfig: ConfigType<typeof supplierConfig>,
    private readonly em: SqlEntityManager,
  ) {
    this.config = this.supConfig.acme;
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
    let destination = await em.findOne(Destination, rawHotel.DestinationId);
    if (!destination) {
      destination = em.create(Destination, {
        id: rawHotel.DestinationId,
        country: rawHotel.Country.trim(),
        city: rawHotel.City.trim(),
      });
    } else {
      destination.city = rawHotel.City.trim();
    }
    em.persist(destination);

    // --- Upsert Hotel ---
    let hotel: Hotel | null = await em.findOne(Hotel, rawHotel.Id, {
      populate: ['destination', 'amenities'],
    });
    if (!hotel) {
      hotel = em.create(Hotel, {
        id: rawHotel.Id,
        destination,
        name: rawHotel.Name.trim(),
        description: rawHotel.Description.trim(),
        location: {
          lat: rawHotel.Latitude || undefined,
          lng: rawHotel.Longitude || undefined,
          address: [rawHotel.Address, rawHotel.PostalCode].join(', ').trim(),
          city: destination.city,
          country: destination.country,
        },
      });
    } else {
      hotel.name = getLongestString(hotel.name, rawHotel.Name.trim());
      hotel.description = getLongestString(
        hotel.description ?? '',
        rawHotel.Description.trim(),
      ).trim();
      hotel.destination = destination;
      hotel.location = {
        lat: rawHotel.Latitude ?? hotel.location.lat,
        lng: rawHotel.Longitude ?? hotel.location.lng,
        address:
          [rawHotel.Address, rawHotel.PostalCode].join(', ').trim() ??
          hotel.location?.address,
        city: destination.city,
        country: destination.country,
      };
    }

    // --- Upsert Amenities ---
    const rawAmenities = sortByLengthAndLexicographically(
      rawHotel.Facilities.map((f) => f.toLowerCase().trim()),
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

    const acmeSupplier = await em.upsert(HotelSupplier, {
      supplier: 'acme',
      hotel,
    });
    hotel.suppliers.add(acmeSupplier);

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

  async removedHotelsFromSupplier(
    newHotels: Hotel[],
    em: SqlEntityManager,
  ): Promise<string[]> {
    const hotelIds = newHotels.map((h) => h.id);
    const hotelsNeedToBeRemoved = await em.find(HotelSupplier, {
      supplier: 'acme',
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
