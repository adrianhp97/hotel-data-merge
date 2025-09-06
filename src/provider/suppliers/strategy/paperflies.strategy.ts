import { Hotel } from 'src/db/entities/hotel.entity';
import { SupplierExtractorStrategy } from '../suppliers.interface';
import supplierConfig from 'src/config/supplier.config';
import { ConfigType } from '@nestjs/config';
import { Destination } from 'src/db/entities/destination.entity';
import { Inject, Injectable } from '@nestjs/common';
import { LockMode, SqlEntityManager } from '@mikro-orm/postgresql';
import {
  getArrayMap,
  mergeArrayByKey,
  sortByLengthAndLexicographically,
} from 'src/utils/array';
import { Amenity, AmenityCategory } from 'src/db/entities/amenity.entity';
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

type LoadPayload = { clean: Hotel; raw: HotelRaw }[];

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
    const rawHotels = await this.extract();
    const cleanedHotels = await this.transforms(rawHotels);
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

    let destination = await em.findOne(Destination, rawHotel.destination_id);
    if (destination === null) {
      destination = new Destination();
      destination.id = rawHotel.destination_id;
      destination.country = rawHotel.location.country;
      destination.city = UNDEFINED_DESTINATION_LABEL;
    }

    let hotel = await em.findOne(Hotel, rawHotel.hotel_id, {
      populate: ['destination'],
    });

    if (hotel === null) {
      hotel = new Hotel();
      hotel.id = rawHotel.hotel_id;
      hotel.destination = destination;
      hotel.name = rawHotel.hotel_name;
      hotel.description = rawHotel.details;
    } else {
      if (hotel.destination.id !== rawHotel.destination_id) {
        // TODO: Handle not the same
      }
      hotel.name = getLongestString(hotel.name, rawHotel.hotel_name);
      hotel.description = getLongestString(
        hotel.description ?? '',
        rawHotel.details,
      );
    }

    hotel.location = {
      address: rawHotel.location.address,
      city: destination.city,
      country: destination.country,

      // Will use existing one if exist
      ...(hotel.location ?? {}),
    };

    // Handle Images
    if (!hotel.images) {
      hotel.images = {};
    }

    hotel.images.site = mergeArrayByKey(
      hotel.images.site ?? [],
      rawHotel.images.site?.map((item) => ({
        link: item.link,
        description: item.caption,
      })) ?? [],
      'link',
    );

    hotel.images.rooms = mergeArrayByKey(
      hotel.images.rooms ?? [],
      rawHotel.images.rooms?.map((item) => ({
        link: item.link,
        description: item.caption,
      })) ?? [],
      'link',
    );

    // Handle Amenities
    await em.populate(hotel, ['amenities']);

    const rawAmenitiesForRoom = sortByLengthAndLexicographically(
      rawHotel.amenities.room?.map((facility) => facility.toLowerCase()) ?? [],
    );
    const rawAmenitiesForGeneral = sortByLengthAndLexicographically(
      rawHotel.amenities.general?.map((facility) => facility.toLowerCase()) ??
        [],
    );

    const existingAmenities = await em.find(Amenity, {
      name: {
        $in: [...rawAmenitiesForRoom, ...rawAmenitiesForGeneral],
      },
    });

    const amenitiesMapping = getArrayMap(existingAmenities, 'name');

    for (const [rawAmenities, category] of [
      [rawAmenitiesForGeneral, 'general'],
      [rawAmenitiesForRoom, 'room'],
    ]) {
      for (const rawAmenity of rawAmenities) {
        if (!amenitiesMapping.has(rawAmenity)) {
          const newAmenity = new Amenity();
          newAmenity.name = rawAmenity;
          newAmenity.category = category as AmenityCategory;
          newAmenity.synonyms = [];

          amenitiesMapping.set(rawAmenity, newAmenity);
        }
        const amenity = amenitiesMapping.get(rawAmenity) as Amenity;
        hotel.amenities.add(amenity);
      }
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
