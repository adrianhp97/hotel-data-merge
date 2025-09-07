import { mapObject, assignExistingKey } from './object';

describe('Object Utilities', () => {
  describe('mapObject', () => {
    it('should map simple properties', () => {
      const source = {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
      };

      const mapping = {
        name: 'firstName',
        surname: 'lastName',
        years: 'age',
      };

      const result = mapObject(source, mapping);

      expect(result).toEqual({
        name: 'John',
        surname: 'Doe',
        years: 30,
      });
    });

    it('should handle nested property paths', () => {
      const source = {
        user: {
          profile: {
            name: 'Alice',
            details: {
              age: 25,
              location: 'NYC',
            },
          },
        },
        settings: {
          theme: 'dark',
        },
      };

      const mapping = {
        userName: 'user.profile.name',
        userAge: 'user.profile.details.age',
        userLocation: 'user.profile.details.location',
        theme: 'settings.theme',
      };

      const result = mapObject(source, mapping);

      expect(result).toEqual({
        userName: 'Alice',
        userAge: 25,
        userLocation: 'NYC',
        theme: 'dark',
      });
    });

    it('should handle missing properties', () => {
      const source = {
        existing: 'value',
      };

      const mapping = {
        present: 'existing',
        missing: 'nonexistent',
        deepMissing: 'some.deep.path',
      };

      const result = mapObject(source, mapping);

      expect(result).toEqual({
        present: 'value',
        missing: undefined,
        deepMissing: undefined,
      });
    });

    it('should handle empty source object', () => {
      const result = mapObject({}, { key: 'value' });
      expect(result).toEqual({ key: undefined });
    });

    it('should handle empty mapping', () => {
      const source = { key: 'value' };
      const result = mapObject(source, {});
      expect(result).toEqual({});
    });

    it('should handle array values', () => {
      const source = {
        items: [1, 2, 3],
        nested: {
          list: ['a', 'b', 'c'],
        },
      };

      const mapping = {
        numbers: 'items',
        letters: 'nested.list',
      };

      const result = mapObject(source, mapping);

      expect(result).toEqual({
        numbers: [1, 2, 3],
        letters: ['a', 'b', 'c'],
      });
    });

    it('should handle boolean and null values', () => {
      const source = {
        isActive: true,
        isDeleted: false,
        data: null,
        nested: {
          flag: true,
          empty: null,
        },
      };

      const mapping = {
        active: 'isActive',
        deleted: 'isDeleted',
        value: 'data',
        nestedFlag: 'nested.flag',
        nestedEmpty: 'nested.empty',
      };

      const result = mapObject(source, mapping);

      expect(result).toEqual({
        active: true,
        deleted: false,
        value: null,
        nestedFlag: true,
        nestedEmpty: null,
      });
    });

    it('should handle complex nested structures', () => {
      const source = {
        hotel: {
          details: {
            name: 'Grand Hotel',
            location: {
              address: '123 Main St',
              coordinates: {
                lat: 40.7128,
                lng: -74.006,
              },
            },
            amenities: ['wifi', 'pool'],
          },
          booking: {
            conditions: ['refundable', 'breakfast included'],
          },
        },
      };

      const mapping = {
        hotelName: 'hotel.details.name',
        hotelAddress: 'hotel.details.location.address',
        latitude: 'hotel.details.location.coordinates.lat',
        longitude: 'hotel.details.location.coordinates.lng',
        facilities: 'hotel.details.amenities',
        terms: 'hotel.booking.conditions',
      };

      const result = mapObject(source, mapping);

      expect(result).toEqual({
        hotelName: 'Grand Hotel',
        hotelAddress: '123 Main St',
        latitude: 40.7128,
        longitude: -74.006,
        facilities: ['wifi', 'pool'],
        terms: ['refundable', 'breakfast included'],
      });
    });

    it('should not mutate the original object', () => {
      const original = { a: 1, b: { c: 2 } };
      const originalCopy = JSON.parse(JSON.stringify(original));

      mapObject(original, { x: 'a', y: 'b.c' });

      expect(original).toEqual(originalCopy);
    });
  });

  describe('assignExistingKey', () => {
    it('should assign only existing keys from source to target', () => {
      const target = {
        name: '',
        age: 0,
        email: '',
      };

      const source = {
        name: 'John Doe',
        age: 30,
        phone: '123-456-7890', // This should not be assigned
        email: 'john@example.com',
      };

      assignExistingKey(target, source);

      expect(target).toEqual({
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      });

      // Ensure phone was not added
      expect('phone' in target).toBe(false);
    });

    it('should overwrite existing values', () => {
      const target = {
        name: 'Old Name',
        age: 25,
        active: false,
      };

      const source = {
        name: 'New Name',
        age: 30,
        active: true,
        extra: 'ignored',
      };

      assignExistingKey(target, source);

      expect(target).toEqual({
        name: 'New Name',
        age: 30,
        active: true,
      });
    });

    it('should handle undefined values in source', () => {
      const target = {
        name: 'John',
        age: 30,
        email: 'john@example.com',
      };

      const source = {
        name: 'Jane',
        age: undefined,
        city: 'NYC', // Should be ignored
      } as any;

      assignExistingKey(target, source);

      expect(target).toEqual({
        name: 'Jane',
        age: undefined, // Should be set to undefined
        email: 'john@example.com', // Should remain unchanged
      });
    });

    it('should handle null values in source', () => {
      const target = {
        name: 'John',
        data: 'some data',
        flag: true,
      };

      const source = {
        name: null,
        data: null,
        extra: 'ignored',
      };

      assignExistingKey(target, source);

      expect(target).toEqual({
        name: null,
        data: null,
        flag: true,
      });
    });

    it('should handle empty target object', () => {
      const target = {};
      const source = { name: 'John', age: 30 };

      assignExistingKey(target, source);

      expect(target).toEqual({});
    });

    it('should handle empty source object', () => {
      const target = { name: 'John', age: 30 };
      const source = {};

      assignExistingKey(target, source);

      expect(target).toEqual({ name: 'John', age: 30 });
    });

    it('should handle complex object values', () => {
      const target = {
        config: { theme: 'light' },
        items: [1, 2, 3],
        user: null,
      };

      const source = {
        config: { theme: 'dark', lang: 'en' },
        items: ['a', 'b'],
        user: { id: 1, name: 'John' },
        extra: 'ignored',
      };

      assignExistingKey(target, source);

      expect(target).toEqual({
        config: { theme: 'dark', lang: 'en' },
        items: ['a', 'b'],
        user: { id: 1, name: 'John' },
      });
    });

    it('should modify target object in place', () => {
      const target = { name: 'original' };
      const source = { name: 'modified' };
      const targetRef = target;

      assignExistingKey(target, source);

      expect(targetRef).toBe(target); // Same reference
      expect(targetRef.name).toBe('modified');
    });

    it('should handle boolean keys correctly', () => {
      const target = {
        isActive: false,
        isDeleted: true,
        isVisible: null,
      };

      const source = {
        isActive: true,
        isDeleted: false,
        isVisible: true,
        newFlag: false, // Should be ignored
      };

      assignExistingKey(target, source);

      expect(target).toEqual({
        isActive: true,
        isDeleted: false,
        isVisible: true,
      });
      expect('newFlag' in target).toBe(false);
    });

    it('should handle numeric keys', () => {
      const target = {
        0: 'zero',
        1: 'one',
        length: 2,
      };

      const source = {
        0: 'updated zero',
        2: 'two', // Should be ignored
        length: 3,
      };

      assignExistingKey(target, source);

      expect(target).toEqual({
        0: 'updated zero',
        1: 'one', // Unchanged
        length: 3,
      });
      expect(2 in target).toBe(false);
    });
  });
});
