import { HotelTransformer } from './hotel.transformer';
import { Hotel, HotelLocation } from 'src/db/entities/hotel.entity';
import { Destination } from 'src/db/entities/destination.entity';
import { Amenity, AmenityCategory } from 'src/db/entities/amenity.entity';

describe('HotelTransformer', () => {
  describe('toDTO', () => {
    let mockDestination: Destination;
    let mockAmenities: Amenity[];
    let mockHotel: Hotel;

    beforeEach(() => {
      mockDestination = {
        id: 5432,
        country: 'Singapore',
        city: 'Singapore',
      } as Destination;

      mockAmenities = [
        {
          id: 1,
          name: 'outdoor pool',
          category: 'general' as AmenityCategory,
          synonyms: [],
        },
        {
          id: 2,
          name: 'business center',
          category: 'general' as AmenityCategory,
          synonyms: [],
        },
        {
          id: 3,
          name: 'tv',
          category: 'room' as AmenityCategory,
          synonyms: [],
        },
        {
          id: 4,
          name: 'coffee machine',
          category: 'room' as AmenityCategory,
          synonyms: [],
        },
      ] as unknown as Amenity[];
    });

    it('should transform complete hotel entity to DTO', () => {
      const location: HotelLocation = {
        lat: 1.264751,
        lng: 103.824006,
        address: '8 Sentosa Gateway, Beach Villas, 098269',
        city: 'Singapore',
        country: 'Singapore',
      };

      const images = {
        rooms: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg',
            description: 'Double room',
          },
        ],
        site: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/1.jpg',
            description: 'Front',
          },
        ],
        amenities: [
          {
            link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/3.jpg',
            description: 'Pool',
          },
        ],
      };

      const bookingConditions = [
        'All children are welcome.',
        'WiFi is available.',
      ];

      mockHotel = {
        id: 'iJhz',
        destination: mockDestination,
        name: 'Beach Villas Singapore',
        location,
        description: 'Surrounded by tropical gardens, on the beachfront.',
        amenities: {
          getItems: jest.fn().mockReturnValue(mockAmenities),
        } as any,
        images,
        booking_conditions: bookingConditions,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result).toEqual({
        id: 'iJhz',
        destination_id: 5432,
        name: 'Beach Villas Singapore',
        location: {
          lat: 1.264751,
          lng: 103.824006,
          address: '8 Sentosa Gateway, Beach Villas, 098269',
          city: 'Singapore',
          country: 'Singapore',
        },
        description: 'Surrounded by tropical gardens, on the beachfront.',
        amenities: {
          general: ['outdoor pool', 'business center'],
          room: ['tv', 'coffee machine'],
        },
        images: {
          rooms: [
            {
              link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg',
              description: 'Double room',
            },
          ],
          site: [
            {
              link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/1.jpg',
              description: 'Front',
            },
          ],
          amenities: [
            {
              link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/3.jpg',
              description: 'Pool',
            },
          ],
        },
        booking_conditions: ['All children are welcome.', 'WiFi is available.'],
      });
    });

    it('should handle hotel with minimal data', () => {
      mockHotel = {
        id: 'minimal',
        destination: mockDestination,
        name: 'Minimal Hotel',
        location: {
          city: 'Singapore',
          country: 'Singapore',
        },
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result).toEqual({
        id: 'minimal',
        destination_id: 5432,
        name: 'Minimal Hotel',
        location: {
          city: 'Singapore',
          country: 'Singapore',
        },
        description: null,
        amenities: {
          general: [],
          room: [],
        },
        images: {
          rooms: [],
          site: [],
          amenities: [],
        },
        booking_conditions: [],
      });
    });

    it('should handle null description', () => {
      mockHotel = {
        id: 'no-desc',
        destination: mockDestination,
        name: 'Hotel Without Description',
        location: { city: 'Test', country: 'Test' },
        description: null,
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.description).toBe(null);
    });

    it('should handle undefined description', () => {
      mockHotel = {
        id: 'undefined-desc',
        destination: mockDestination,
        name: 'Hotel With Undefined Description',
        location: { city: 'Test', country: 'Test' },
        description: undefined,
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.description).toBe(null);
    });

    it('should handle empty amenities collection', () => {
      mockHotel = {
        id: 'no-amenities',
        destination: mockDestination,
        name: 'Hotel Without Amenities',
        location: { city: 'Test', country: 'Test' },
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.amenities).toEqual({
        general: [],
        room: [],
      });
    });

    it('should group amenities by category correctly', () => {
      const mixedAmenities = [
        {
          id: 1,
          name: 'wifi',
          category: 'general' as AmenityCategory,
        },
        {
          id: 2,
          name: 'minibar',
          category: 'room' as AmenityCategory,
        },
        {
          id: 3,
          name: 'pool',
          category: 'general' as AmenityCategory,
        },
        {
          id: 4,
          name: 'balcony',
          category: 'room' as AmenityCategory,
        },
        {
          id: 5,
          name: 'spa',
          category: 'general' as AmenityCategory,
        },
      ] as Amenity[];

      mockHotel = {
        id: 'mixed-amenities',
        destination: mockDestination,
        name: 'Hotel With Mixed Amenities',
        location: { city: 'Test', country: 'Test' },
        amenities: {
          getItems: jest.fn().mockReturnValue(mixedAmenities),
        } as any,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.amenities.general).toEqual(['wifi', 'pool', 'spa']);
      expect(result.amenities.room).toEqual(['minibar', 'balcony']);
    });

    it('should handle missing images gracefully', () => {
      mockHotel = {
        id: 'no-images',
        destination: mockDestination,
        name: 'Hotel Without Images',
        location: { city: 'Test', country: 'Test' },
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
        images: undefined,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.images).toEqual({
        rooms: [],
        site: [],
        amenities: [],
      });
    });

    it('should handle partial images object', () => {
      mockHotel = {
        id: 'partial-images',
        destination: mockDestination,
        name: 'Hotel With Partial Images',
        location: { city: 'Test', country: 'Test' },
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
        images: {
          rooms: [
            { link: 'room1.jpg', description: 'Room 1' },
            { link: 'room2.jpg', description: 'Room 2' },
          ],
          // site and amenities missing
        },
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.images).toEqual({
        rooms: [
          { link: 'room1.jpg', description: 'Room 1' },
          { link: 'room2.jpg', description: 'Room 2' },
        ],
        site: [],
        amenities: [],
      });
    });

    it('should handle missing booking conditions', () => {
      mockHotel = {
        id: 'no-conditions',
        destination: mockDestination,
        name: 'Hotel Without Booking Conditions',
        location: { city: 'Test', country: 'Test' },
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
        booking_conditions: undefined,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.booking_conditions).toEqual([]);
    });

    it('should handle empty booking conditions array', () => {
      mockHotel = {
        id: 'empty-conditions',
        destination: mockDestination,
        name: 'Hotel With Empty Booking Conditions',
        location: { city: 'Test', country: 'Test' },
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
        booking_conditions: [],
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.booking_conditions).toEqual([]);
    });

    it('should handle complex location object', () => {
      const complexLocation: HotelLocation = {
        lat: -33.8688,
        lng: 151.2093,
        address: '123 Complex Street, Building A, Unit 45',
        city: 'Sydney',
        country: 'Australia',
      };

      mockHotel = {
        id: 'complex-location',
        destination: {
          id: 9999,
          city: 'Sydney',
          country: 'Australia',
        } as Destination,
        name: 'Hotel With Complex Location',
        location: complexLocation,
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.location).toEqual(complexLocation);
      expect(result.destination_id).toBe(9999);
    });

    it('should handle location with undefined coordinates', () => {
      const locationWithoutCoords: HotelLocation = {
        address: '456 No Coords Ave',
        city: 'Unknown City',
        country: 'Unknown Country',
      };

      mockHotel = {
        id: 'no-coords',
        destination: mockDestination,
        name: 'Hotel Without Coordinates',
        location: locationWithoutCoords,
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.location).toEqual(locationWithoutCoords);
      expect(result.location.lat).toBeUndefined();
      expect(result.location.lng).toBeUndefined();
    });

    it('should preserve all image categories', () => {
      const allImages = {
        rooms: [{ link: 'room.jpg', description: 'Room' }],
        site: [{ link: 'site.jpg', description: 'Site' }],
        amenities: [{ link: 'amenity.jpg', description: 'Amenity' }],
      };

      mockHotel = {
        id: 'all-images',
        destination: mockDestination,
        name: 'Hotel With All Image Types',
        location: { city: 'Test', country: 'Test' },
        amenities: {
          getItems: jest.fn().mockReturnValue([]),
        } as any,
        images: allImages,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      expect(result.images.rooms).toEqual(allImages.rooms);
      expect(result.images.site).toEqual(allImages.site);
      expect(result.images.amenities).toEqual(allImages.amenities);
    });

    it('should handle amenities with new categories gracefully', () => {
      // Test that the transformer handles unknown amenity categories
      const amenitiesWithUnknownCategory = [
        {
          id: 1,
          name: 'standard wifi',
          category: 'general' as AmenityCategory,
        },
        {
          id: 2,
          name: 'unknown amenity',
          category: 'unknown' as AmenityCategory, // This would be a new category
        },
      ] as Amenity[];

      mockHotel = {
        id: 'unknown-category',
        destination: mockDestination,
        name: 'Hotel With Unknown Amenity Category',
        location: { city: 'Test', country: 'Test' },
        amenities: {
          getItems: jest.fn().mockReturnValue(amenitiesWithUnknownCategory),
        } as any,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      // Should still have general category
      expect(result.amenities.general).toEqual(['standard wifi']);
      expect(result.amenities.room).toEqual([]);
      // Unknown category amenity should be in the accumulated object
      expect((result.amenities as any).unknown).toEqual(['unknown amenity']);
    });

    it('should return references to original arrays (not immutable)', () => {
      const originalImages = {
        rooms: [{ link: 'original.jpg', description: 'Original' }],
      };

      const originalBookingConditions = ['Original condition'];

      mockHotel = {
        id: 'reference-test',
        destination: mockDestination,
        name: 'Reference Test Hotel',
        location: { city: 'Test', country: 'Test' },
        amenities: {
          getItems: jest.fn().mockReturnValue(mockAmenities),
        } as any,
        images: originalImages,
        booking_conditions: originalBookingConditions,
      } as unknown as Hotel;

      const result = HotelTransformer.toDTO(mockHotel);

      // The transformer returns references to the original arrays
      expect(result.images.rooms).toBe(originalImages.rooms);
      expect(result.booking_conditions).toBe(originalBookingConditions);

      // Modifying the result affects the original (expected behavior)
      result.images.rooms.push({ link: 'new.jpg', description: 'New' });
      result.booking_conditions.push('New condition');

      // Original is affected since they share references
      expect(originalImages.rooms).toHaveLength(2);
      expect(originalBookingConditions).toHaveLength(2);
    });
  });
});
