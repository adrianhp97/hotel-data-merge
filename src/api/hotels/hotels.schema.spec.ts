import { ZodError } from 'zod';
import { getHotelsParameterSchema, GetHotelsParameterDTO } from './hotels.schema';

describe('HotelsSchema', () => {
  describe('getHotelsParameterSchema', () => {
    it('should accept empty object', () => {
      const data = {};
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it('should accept valid destination_id as number', () => {
      const data = { destination_id: 5432 };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination_id).toBe(5432);
      }
    });

    it('should coerce string destination_id to number', () => {
      const data = { destination_id: '5432' };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination_id).toBe(5432);
      }
    });

    it('should accept valid hotel_ids array', () => {
      const data = { hotel_ids: ['hotel1', 'hotel2', 'hotel3'] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual(['hotel1', 'hotel2', 'hotel3']);
      }
    });

    it('should accept both destination_id and hotel_ids', () => {
      const data = {
        destination_id: 5432,
        hotel_ids: ['hotel1', 'hotel2'],
      };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination_id).toBe(5432);
        expect(result.data.hotel_ids).toEqual(['hotel1', 'hotel2']);
      }
    });

    it('should accept empty hotel_ids array', () => {
      const data = { hotel_ids: [] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual([]);
      }
    });

    it('should accept single hotel_id in array', () => {
      const data = { hotel_ids: ['hotel1'] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual(['hotel1']);
      }
    });

    it('should reject negative destination_id', () => {
      const data = { destination_id: -1 };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues[0].path).toEqual(['destination_id']);
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should reject zero destination_id', () => {
      const data = { destination_id: 0 };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues[0].path).toEqual(['destination_id']);
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should reject non-integer destination_id', () => {
      const data = { destination_id: 5432.5 };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues[0].path).toEqual(['destination_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject non-numeric string destination_id', () => {
      const data = { destination_id: 'abc' };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues[0].path).toEqual(['destination_id']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null destination_id', () => {
      const data = { destination_id: null };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues[0].path).toEqual(['destination_id']);
      }
    });

    it('should reject non-array hotel_ids', () => {
      const data = { hotel_ids: 'hotel1' };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues[0].path).toEqual(['hotel_ids']);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject hotel_ids with non-string elements', () => {
      const data = { hotel_ids: ['hotel1', 123, 'hotel3'] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues[0].path).toEqual(['hotel_ids', 1]);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject hotel_ids with null elements', () => {
      const data = { hotel_ids: ['hotel1', null, 'hotel3'] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues[0].path).toEqual(['hotel_ids', 1]);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject hotel_ids with undefined elements', () => {
      const data = { hotel_ids: ['hotel1', undefined, 'hotel3'] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues[0].path).toEqual(['hotel_ids', 1]);
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should accept hotel_ids with special characters', () => {
      const data = {
        hotel_ids: ['hotel-1', 'hotel_2', 'hotel.3', 'hotel@4', 'hotel#5'],
      };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual([
          'hotel-1',
          'hotel_2',
          'hotel.3',
          'hotel@4',
          'hotel#5',
        ]);
      }
    });

    it('should accept hotel_ids with unicode characters', () => {
      const data = {
        hotel_ids: ['hôtel1', 'होटल2', '酒店3', 'فندق4'],
      };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual([
          'hôtel1',
          'होटल2',
          '酒店3',
          'فندق4',
        ]);
      }
    });

    it('should accept large positive destination_id', () => {
      const data = { destination_id: 999999999 };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination_id).toBe(999999999);
      }
    });

    it('should accept large hotel_ids array', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `hotel${i}`);
      const data = { hotel_ids: largeArray };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual(largeArray);
      }
    });

    it('should reject unknown fields', () => {
      const data = {
        destination_id: 5432,
        hotel_ids: ['hotel1'],
        unknown_field: 'value',
      };
      const result = getHotelsParameterSchema.safeParse(data);

      // Zod should strip unknown fields by default, so this should pass
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination_id).toBe(5432);
        expect(result.data.hotel_ids).toEqual(['hotel1']);
        expect('unknown_field' in result.data).toBe(false);
      }
    });

    it('should handle mixed valid and invalid data', () => {
      const data = {
        destination_id: -1, // invalid
        hotel_ids: ['hotel1', 'hotel2'], // valid
      };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(['destination_id']);
      }
    });
  });

  describe('GetHotelsParameterDTO type', () => {
    it('should correctly infer type from schema', () => {
      // This is a compile-time test
      const validDto: GetHotelsParameterDTO = {
        destination_id: 5432,
        hotel_ids: ['hotel1', 'hotel2'],
      };

      expect(validDto.destination_id).toBe(5432);
      expect(validDto.hotel_ids).toEqual(['hotel1', 'hotel2']);
    });

    it('should allow optional fields', () => {
      const dto1: GetHotelsParameterDTO = {};
      const dto2: GetHotelsParameterDTO = { destination_id: 5432 };
      const dto3: GetHotelsParameterDTO = { hotel_ids: ['hotel1'] };

      expect(dto1).toEqual({});
      expect(dto2.destination_id).toBe(5432);
      expect(dto3.hotel_ids).toEqual(['hotel1']);
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle minimum positive integer for destination_id', () => {
      const data = { destination_id: 1 };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination_id).toBe(1);
      }
    });

    it('should handle empty strings in hotel_ids', () => {
      const data = { hotel_ids: ['', 'hotel1', ''] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual(['', 'hotel1', '']);
      }
    });

    it('should handle whitespace-only strings in hotel_ids', () => {
      const data = { hotel_ids: ['   ', 'hotel1', '\t\n'] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual(['   ', 'hotel1', '\t\n']);
      }
    });

    it('should handle very long hotel_id strings', () => {
      const longId = 'a'.repeat(10000);
      const data = { hotel_ids: [longId] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual([longId]);
      }
    });

    it('should handle coercion of numeric string destination_id with leading zeros', () => {
      const data = { destination_id: '00005432' };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destination_id).toBe(5432);
      }
    });

    it('should reject decimal string destination_id', () => {
      const data = { destination_id: '54.32' };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['destination_id']);
      }
    });

    it('should handle duplicate hotel_ids', () => {
      const data = { hotel_ids: ['hotel1', 'hotel2', 'hotel1', 'hotel2'] };
      const result = getHotelsParameterSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hotel_ids).toEqual([
          'hotel1',
          'hotel2',
          'hotel1',
          'hotel2',
        ]);
      }
    });
  });

  describe('performance considerations', () => {
    it('should efficiently handle large valid datasets', () => {
      const start = Date.now();
      const largeHotelIds = Array.from({ length: 10000 }, (_, i) => `hotel${i}`);
      const data = {
        destination_id: 5432,
        hotel_ids: largeHotelIds,
      };

      const result = getHotelsParameterSchema.safeParse(data);
      const end = Date.now();

      expect(result.success).toBe(true);
      expect(end - start).toBeLessThan(1000); // Should parse in less than 1 second
    });

    it('should efficiently reject invalid datasets', () => {
      const start = Date.now();
      const data = {
        destination_id: -1,
        hotel_ids: Array.from({ length: 1000 }, (_, i) => i), // invalid - numbers instead of strings
      };

      const result = getHotelsParameterSchema.safeParse(data);
      const end = Date.now();

      expect(result.success).toBe(false);
      expect(end - start).toBeLessThan(1000); // Should fail fast
    });
  });
});