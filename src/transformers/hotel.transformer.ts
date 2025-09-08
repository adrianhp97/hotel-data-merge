import { Amenity } from 'src/db/entities/amenity.entity';
import { Hotel } from 'src/db/entities/hotel.entity';
import { HotelDTO } from 'src/dto/hotel.dto';

export class HotelTransformer {
  static toDTO(entity: Hotel): HotelDTO {
    // Group amenities by category and remove synonym duplicates
    const amenitiesByCategory = entity.amenities.getItems().reduce(
      (acc, amenity) => {
        if (!acc[amenity.category]) acc[amenity.category] = [];
        acc[amenity.category].push(amenity);
        return acc;
      },
      {} as Record<string, Amenity[]>,
    );

    // Remove synonym duplicates for each category
    const groupedAmenities: any = {
      general: HotelTransformer.removeSynonymDuplicates(amenitiesByCategory.general || []),
      room: HotelTransformer.removeSynonymDuplicates(amenitiesByCategory.room || []),
    };
    
    // Add any other categories that exist (for extensibility)
    for (const [category, amenities] of Object.entries(amenitiesByCategory)) {
      if (category !== 'general' && category !== 'room') {
        groupedAmenities[category] = HotelTransformer.removeSynonymDuplicates(amenities);
      }
    }

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

  private static removeSynonymDuplicates(amenities: Amenity[]): string[] {
    // First identify all names that appear as synonyms of other amenities
    const synonymNames = new Set<string>();
    for (const amenity of amenities) {
      if (amenity.synonyms && Array.isArray(amenity.synonyms)) {
        for (const synonym of amenity.synonyms) {
          synonymNames.add(synonym.toLowerCase().trim());
        }
      }
    }
    
    // Sort by longest name first to prioritize more descriptive names
    const sortedAmenities = [...amenities].sort((a, b) => b.name.length - a.name.length);
    
    const visited = new Set<string>();
    const result: string[] = [];

    for (const amenity of sortedAmenities) {
      const normalizedName = amenity.name.toLowerCase().trim();
      
      // Skip if we've already seen this name or if this name is a synonym of another amenity
      if (visited.has(normalizedName) || synonymNames.has(normalizedName)) {
        continue;
      }

      // Add this amenity to result
      result.push(amenity.name);
      
      // Mark this name and all its synonyms as visited
      visited.add(normalizedName);
      if (amenity.synonyms && Array.isArray(amenity.synonyms)) {
        for (const synonym of amenity.synonyms) {
          visited.add(synonym.toLowerCase().trim());
        }
      }
    }

    return result;
  }
}
