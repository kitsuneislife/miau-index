import {
  generateId,
  delay,
  retryWithBackoff,
  slugify,
  deepClone,
  stringSimilarity,
  groupBy,
  uniqueBy,
  chunk,
  parseDate,
  formatBytes,
  safeJsonParse,
  truncate,
} from '../helpers';

describe('Helpers', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });

    it('should generate IDs with prefix', () => {
      const id = generateId('anime');
      expect(id).toMatch(/^anime-/);
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(95);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn(async () => 'success');
      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success';
      });

      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn(async () => {
        throw new Error('Always fails');
      });

      await expect(retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 })).rejects.toThrow(
        'Always fails'
      );

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('slugify', () => {
    it('should convert string to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Cowboy Bebop: The Movie')).toBe('cowboy-bebop-the-movie');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });

    it('should handle special characters', () => {
      expect(slugify('café')).toBe('caf');
      expect(slugify('hello@world!')).toBe('helloworld');
    });
  });

  describe('deepClone', () => {
    it('should clone simple objects', () => {
      const obj = { a: 1, b: 2 };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    it('should clone nested objects', () => {
      const obj = { a: { b: { c: 1 } } };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned.a).not.toBe(obj.a);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, [3, 4]];
      const cloned = deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should clone dates', () => {
      const date = new Date('2024-01-01');
      const cloned = deepClone(date);

      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
  });

  describe('stringSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(stringSimilarity('hello', 'hello')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = stringSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThan(0.5);
    });

    it('should calculate similarity correctly', () => {
      expect(stringSimilarity('kitten', 'sitting')).toBeGreaterThan(0.5);
      expect(stringSimilarity('saturday', 'sunday')).toBeGreaterThan(0.5);
    });
  });

  describe('groupBy', () => {
    it('should group array items by key', () => {
      const items = [
        { type: 'a', value: 1 },
        { type: 'b', value: 2 },
        { type: 'a', value: 3 },
      ];

      const grouped = groupBy(items, (item) => item.type);

      expect(grouped['a']).toHaveLength(2);
      expect(grouped['b']).toHaveLength(1);
    });
  });

  describe('uniqueBy', () => {
    it('should remove duplicates by key', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' },
      ];

      const unique = uniqueBy(items, (item) => item.id);

      expect(unique).toHaveLength(2);
      expect(unique[0].name).toBe('a');
      expect(unique[1].name).toBe('b');
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      const arr = [1, 2, 3, 4, 5];
      const chunks = chunk(arr, 2);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual([1, 2]);
      expect(chunks[1]).toEqual([3, 4]);
      expect(chunks[2]).toEqual([5]);
    });
  });

  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      const date = parseDate('2024-01-01T00:00:00.000Z');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getUTCFullYear()).toBe(2024);
    });

    it('should return undefined for invalid dates', () => {
      expect(parseDate('invalid')).toBeUndefined();
      expect(parseDate(undefined)).toBeUndefined();
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"a":1}', {});
      expect(result).toEqual({ a: 1 });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJsonParse('invalid json', fallback);
      expect(result).toBe(fallback);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const str = 'This is a very long string';
      const truncated = truncate(str, 10);

      expect(truncated).toBe('This is...');
      expect(truncated.length).toBeLessThanOrEqual(10);
    });

    it('should not truncate short strings', () => {
      const str = 'Short';
      expect(truncate(str, 10)).toBe('Short');
    });

    it('should use custom suffix', () => {
      const str = 'This is a very long string';
      const truncated = truncate(str, 10, '---');

      expect(truncated).toBe('This is---');
    });
  });
});
