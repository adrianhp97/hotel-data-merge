import { Hotel } from 'src/db/entities/hotel.entity';
import { SupplierExtractorStrategy } from '../suppliers.interface';
import supplierConfig from 'src/config/supplier.config';
import { ConfigType } from '@nestjs/config';
import { Destination } from 'src/db/entities/destination.entity';
import { Inject, Injectable } from '@nestjs/common';
import { LockMode, SqlEntityManager } from '@mikro-orm/postgresql';
import { getArrayMap, sortByLengthAndLexicographically } from 'src/utils/array';
import { Amenity } from 'src/db/entities/amenity.entity';
import { getLongestString } from 'src/utils/string';

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

type LoadPayload = { clean: Hotel; raw: HotelRaw }[];

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
    const rawHotels = await this.extract();
    const cleanedHotels = await this.transforms(rawHotels);
    console.log(cleanedHotels);
    return this.loads(cleanedHotels);
  }

  async extract() {
    const response = await fetch(this.config.host ?? '');

    const data = (await response.json()) as HotelRaw[];

    return data;
  }

  async transforms(rawData: HotelRaw[]): Promise<LoadPayload> {
    return Promise.all(
      rawData.map(async (item) => {
        const cleanHotel = await this.transform(item);
        return {
          clean: cleanHotel,
          raw: item,
        };
      }),
    );
  }

  async transform(rawHotel: HotelRaw): Promise<Hotel> {
    const em = this.em.fork();

    let destination = await em.findOne(Destination, rawHotel.DestinationId);
    if (destination === null) {
      destination = new Destination();
      destination.id = rawHotel.DestinationId;
    }

    destination.country = rawHotel.Country;
    destination.city = rawHotel.City;

    let hotel = await em.findOne(Hotel, rawHotel.Id, {
      populate: ['destination'],
    });

    if (hotel === null) {
      hotel = new Hotel();
      hotel.id = rawHotel.Id;
      hotel.destination = destination;
      hotel.name = rawHotel.Name;
      hotel.description = rawHotel.Description;
    } else {
      if (hotel.destination.id !== rawHotel.DestinationId) {
        // TODO: Handle not the same
      }
      hotel.name = getLongestString(hotel.name, rawHotel.Name);
      hotel.description = getLongestString(
        hotel.description ?? '',
        rawHotel.Description,
      );
    }

    hotel.location = {
      ...(hotel.location ?? {}),
      // Will use data from supplier as primary source of truth
      lat: rawHotel.Latitude,
      lng: rawHotel.Longitude,
      address: [rawHotel.Address, rawHotel.PostalCode].join(', '),
      city: destination.city,
      country: destination.country,
    };

    // Handle Amenities
    await em.populate(hotel, ['amenities']);

    const rawAmenities = sortByLengthAndLexicographically(
      rawHotel.Facilities.map((facility) => facility.toLowerCase()),
    );

    const existingAmenities = await em.find(Amenity, {
      name: {
        $in: rawAmenities,
      },
    });

    const amenitiesMapping = getArrayMap(existingAmenities, 'name');

    for (const rawAmenity of rawAmenities) {
      if (!amenitiesMapping.has(rawAmenity)) {
        const newAmenity = new Amenity();
        newAmenity.name = rawAmenity;
        newAmenity.category = 'general';
        newAmenity.synonyms = [];

        amenitiesMapping.set(rawAmenity, newAmenity);
      }
      const amenity = amenitiesMapping.get(rawAmenity) as Amenity;
      hotel.amenities.add(amenity);
    }

    return hotel;
  }

  async loads(data: LoadPayload): Promise<Hotel[]> {
    return Promise.all(data.map((item) => this.load(item.clean, item.raw)));
  }

  async load(hotel: Hotel, rawData: HotelRaw) {
    const em = this.em.fork();

    try {
      await em.lock(Hotel, LockMode.OPTIMISTIC, hotel.updated_at);
    } catch {
      hotel = await this.transform(rawData);
    }

    for (let idx = 0; idx < hotel.amenities.length; idx++) {
      em.persist(hotel.amenities[idx]);
    }

    em.persist(hotel.destination);
    em.persist(hotel);
    await em.flush();

    return hotel;
  }
}
