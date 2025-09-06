import { Hotel } from 'src/db/entities/hotel.entity';
import { HotelDTO } from 'src/dto/hotel.dto';

export class HotelTransformer {
  static toDTO(entity: Hotel): HotelDTO {
    // TODO: removed synonyms
    const groupedAmenities = entity.amenities.getItems().reduce(
      (acc, amenity) => {
        if (!acc[amenity.category]) acc[amenity.category] = [];
        acc[amenity.category].push(amenity.name);
        return acc;
      },
      { general: [] as string[], room: [] as string[] },
    );

    return {
      id: entity.id,
      destination_id: entity.destination.id,
      name: entity.name,
      location: entity.location,
      description: entity.description ?? null,
      amenities: groupedAmenities,
      images: {
        rooms: entity.images?.rooms ?? [],
        site: entity.images?.site ?? [],
        amenities: entity.images?.amenities ?? [],
      },
      booking_conditions: entity.booking_conditions ?? [],
    };
  }
}
