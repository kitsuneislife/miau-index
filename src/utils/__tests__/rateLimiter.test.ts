import { RateLimiter, createRateLimiter } from '../rateLimiter';
import { RateLimitError } from '../errors';
import { delay } from '../helpers';

describe('RateLimiter', () => {
  describe('basic functionality', () => {
    it('should allow requests within limit', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      for (let i = 0; i < 5; i++) {
        await expect(limiter.checkLimit()).resolves.toBeUndefined();
        limiter.recordRequest();
      }
    });

    it('should throw RateLimitError when limit exceeded', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      await limiter.checkLimit();
      limiter.recordRequest();

      await limiter.checkLimit();
      limiter.recordRequest();

      await expect(limiter.checkLimit()).rejects.toThrow(RateLimitError);
    });

    it('should reset after time window', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 200,
      });

      await limiter.checkLimit();
      limiter.recordRequest();

      await limiter.checkLimit();
      limiter.recordRequest();

      await expect(limiter.checkLimit()).rejects.toThrow(RateLimitError);

      await delay(250);

      await expect(limiter.checkLimit()).resolves.toBeUndefined();
    });
  });

  describe('execute', () => {
    it('should execute function and record request', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      });

      const fn = jest.fn(async () => 'result');
      const result = await limiter.execute('test', fn);

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
      await expect(limiter.checkLimit('test')).rejects.toThrow(RateLimitError);
    });

    it('should record failed requests', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      const fn = jest.fn(async () => {
        throw new Error('Test error');
      });

      await expect(limiter.execute('test', fn)).rejects.toThrow('Test error');

      const usage = limiter.getUsage('test');
      expect(usage.current).toBe(1);
    });

    it('should skip successful requests if configured', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
        skipSuccessfulRequests: true,
      });

      const fn = jest.fn(async () => 'result');
      await limiter.execute('test', fn);

      const usage = limiter.getUsage('test');
      expect(usage.current).toBe(0);
    });
  });

  describe('getUsage', () => {
    it('should return current usage statistics', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      await limiter.checkLimit();
      limiter.recordRequest();

      await limiter.checkLimit();
      limiter.recordRequest();

      const usage = limiter.getUsage();

      expect(usage.current).toBe(2);
      expect(usage.limit).toBe(5);
      expect(usage.remaining).toBe(3);
      expect(usage.resetAt).toBeGreaterThan(Date.now());
    });
  });

  describe('reset', () => {
    it('should reset rate limit for specific key', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      });

      await limiter.checkLimit('test');
      limiter.recordRequest('test');

      await expect(limiter.checkLimit('test')).rejects.toThrow(RateLimitError);

      limiter.reset('test');

      await expect(limiter.checkLimit('test')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all rate limit data', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      });

      await limiter.checkLimit('key1');
      limiter.recordRequest('key1');

      await limiter.checkLimit('key2');
      limiter.recordRequest('key2');

      limiter.clear();

      const usage1 = limiter.getUsage('key1');
      const usage2 = limiter.getUsage('key2');

      expect(usage1.current).toBe(0);
      expect(usage2.current).toBe(0);
    });
  });

  describe('presets', () => {
    it('should create strict rate limiter', () => {
      const limiter = createRateLimiter('strict');
      const usage = limiter.getUsage();

      expect(usage.limit).toBe(30);
    });

    it('should create moderate rate limiter', () => {
      const limiter = createRateLimiter('moderate');
      const usage = limiter.getUsage();

      expect(usage.limit).toBe(60);
    });

    it('should create lenient rate limiter', () => {
      const limiter = createRateLimiter('lenient');
      const usage = limiter.getUsage();

      expect(usage.limit).toBe(120);
    });
  });
});
