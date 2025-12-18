import { CacheService } from '../cache';
import { delay } from '../helpers';

describe('CacheService', () => {
  let cache: CacheService<string>;

  beforeEach(() => {
    cache = new CacheService<string>(1000); // 1 second TTL
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should expire values after TTL', async () => {
      cache.set('key1', 'value1', { ttl: 100 });
      expect(cache.get('key1')).toBe('value1');

      await delay(150);
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      cache.set('key1', 'value1', { ttl: 100 });
      expect(cache.has('key1')).toBe(true);

      await delay(150);
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a value', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.stats().size).toBe(0);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('key1', 'cached');

      const result = await cache.getOrSet('key1', async () => 'computed');
      expect(result).toBe('cached');
    });

    it('should compute and cache value if not exists', async () => {
      const result = await cache.getOrSet('key1', async () => 'computed');

      expect(result).toBe('computed');
      expect(cache.get('key1')).toBe('computed');
    });

    it('should recompute after expiration', async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        return `computed-${callCount}`;
      };

      const result1 = await cache.getOrSet('key1', factory, { ttl: 100 });
      expect(result1).toBe('computed-1');
      expect(callCount).toBe(1);

      await delay(150);

      const result2 = await cache.getOrSet('key1', factory, { ttl: 100 });
      expect(result2).toBe('computed-2');
      expect(callCount).toBe(2);
    });
  });

  describe('stats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.stats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });
  });
});
