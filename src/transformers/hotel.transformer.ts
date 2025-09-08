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

  /**
   * Remove duplicate amenity names that are synonyms of other amenities
   * @param amenities Array of amenity objects with name and synonyms
   * @returns Array of amenity names with synonyms removed
   */
  private static removeSynonymDuplicates(amenities: Amenity[]): string[] {
    // Create a map of primary amenity names to their synonyms
    const primaryAmenityMap = new Map<string, string>();
    const allSynonyms = new Set<string>();

    // First pass: collect all primary amenities and their synonyms
    for (const amenity of amenities) {
      const primaryName = amenity.name.toLowerCase().trim();
      primaryAmenityMap.set(primaryName, amenity.name);
      
      // Add all synonyms to the set (handle cases where synonyms might be undefined)
      if (amenity.synonyms && Array.isArray(amenity.synonyms)) {
        for (const synonym of amenity.synonyms) {
          const normalizedSynonym = synonym.toLowerCase().trim();
          allSynonyms.add(normalizedSynonym);
          // Map synonym to primary amenity name
          if (!primaryAmenityMap.has(normalizedSynonym)) {
            primaryAmenityMap.set(normalizedSynonym, amenity.name);
          }
        }
      }
    }

    // Second pass: collect unique amenities, preferring primary names over synonyms
    const result = new Set<string>();
    const processedNames = new Set<string>();

    for (const amenity of amenities) {
      const normalizedName = amenity.name.toLowerCase().trim();
      
      // Skip if we've already processed this name or if it's a synonym of another amenity
      if (processedNames.has(normalizedName)) {
        continue;
      }

      // Check if this amenity name is a synonym of another amenity
      const isThisASynonym = allSynonyms.has(normalizedName);
      
      if (!isThisASynonym) {
        // This is a primary amenity, add it
        result.add(amenity.name);
        processedNames.add(normalizedName);
        
        // Also mark all its synonyms as processed
        if (amenity.synonyms && Array.isArray(amenity.synonyms)) {
          for (const synonym of amenity.synonyms) {
            processedNames.add(synonym.toLowerCase().trim());
          }
        }
      } else {
        // This is a synonym, check if its primary hasn't been added yet
        const primaryName = primaryAmenityMap.get(normalizedName);
        if (primaryName && !Array.from(result).some(name => name.toLowerCase() === primaryName.toLowerCase())) {
          // Find the primary amenity and add it
          const primaryAmenity = amenities.find(a => a.name.toLowerCase() === primaryName.toLowerCase());
          if (primaryAmenity) {
            result.add(primaryAmenity.name);
            processedNames.add(primaryName.toLowerCase());
            
            // Mark all synonyms as processed
            if (primaryAmenity.synonyms && Array.isArray(primaryAmenity.synonyms)) {
              for (const synonym of primaryAmenity.synonyms) {
                processedNames.add(synonym.toLowerCase().trim());
              }
            }
          }
        }
      }
    }

    return Array.from(result);
  }
}
