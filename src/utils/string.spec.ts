import { getLongestString } from './string';

describe('String Utilities', () => {
  describe('getLongestString', () => {
    it('should return first string when it is longer', () => {
      const result = getLongestString('longer string', 'short');
      expect(result).toBe('longer string');
    });

    it('should return second string when it is longer', () => {
      const result = getLongestString('short', 'much longer string');
      expect(result).toBe('much longer string');
    });

    it('should return first string when both are equal length', () => {
      const result = getLongestString('same', 'size');
      expect(result).toBe('same');
    });

    it('should handle empty strings', () => {
      const result1 = getLongestString('', 'non-empty');
      expect(result1).toBe('non-empty');

      const result2 = getLongestString('non-empty', '');
      expect(result2).toBe('non-empty');

      const result3 = getLongestString('', '');
      expect(result3).toBe('');
    });

    it('should handle whitespace-only strings', () => {
      const result1 = getLongestString('   ', 'text');
      expect(result1).toBe('text');

      const result2 = getLongestString('text', '   ');
      expect(result2).toBe('text');

      const result3 = getLongestString('   ', '  ');
      expect(result3).toBe('   '); // First one wins on equal length
    });

    it('should handle special characters and unicode', () => {
      const result1 = getLongestString('café', '🎉🎊');
      expect(result1).toBe('café');

      const result2 = getLongestString('短', 'longer text');
      expect(result2).toBe('longer text');

      const result3 = getLongestString('emoji: 🚀', 'text');
      expect(result3).toBe('emoji: 🚀');
    });

    it('should handle multiline strings', () => {
      const multiline = `This is a
multiline
string`;
      const singleLine = 'Single line';

      const result = getLongestString(multiline, singleLine);
      expect(result).toBe(multiline);
    });

    it('should handle strings with only numbers', () => {
      const result = getLongestString('12345', '123');
      expect(result).toBe('12345');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const shortString = 'b'.repeat(10);

      const result = getLongestString(longString, shortString);
      expect(result).toBe(longString);
      expect(result.length).toBe(1000);
    });

    it('should be consistent with length comparison edge cases', () => {
      // Test various edge cases to ensure consistent behavior
      const testCases = [
        ['a', 'b', 'a'], // Equal length, first wins
        ['aa', 'b', 'aa'], // First longer
        ['a', 'bb', 'bb'], // Second longer
        ['hello world', 'hello-world', 'hello world'], // Equal length, first wins
        ['   trim   ', 'notrim', '   trim   '], // First is longer (9 vs 6)
      ];

      testCases.forEach(([str1, str2, expected]) => {
        const result = getLongestString(str1, str2);
        expect(result).toBe(expected);
      });
    });

    it('should handle null-like inputs gracefully', () => {
      // Note: TypeScript would prevent these, but testing runtime behavior
      // The function will throw with null/undefined, so we test it throws
      expect(() =>
        getLongestString('valid' as any, undefined as any),
      ).toThrow();
      expect(() => getLongestString(null as any, 'valid')).toThrow();
      expect(() => getLongestString(undefined as any, null as any)).toThrow();
    });
  });
});
