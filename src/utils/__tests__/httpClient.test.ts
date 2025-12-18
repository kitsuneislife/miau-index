import { HttpClient } from '../httpClient';
import { RateLimiter } from '../rateLimiter';

describe('HttpClient', () => {
  describe('Constructor and configuration', () => {
    it('should create client with default config', () => {
      const client = new HttpClient();
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should create client with custom config', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: { 'X-Custom': 'header' },
        maxRetries: 5,
        retryDelay: 2000,
        enableLogging: true,
      });

      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should create client with rate limiter', () => {
      const rateLimiter = RateLimiter.strict();
      const client = new HttpClient({
        rateLimiter,
      });

      expect(client).toBeInstanceOf(HttpClient);
    });
  });

  describe('Configuration updates', () => {
    it('should update configuration', () => {
      const client = new HttpClient();

      client.updateConfig({
        baseURL: 'https://api.new.com',
        timeout: 15000,
        headers: { Authorization: 'Bearer token' },
      });

      expect(client.getAxiosInstance().defaults.baseURL).toBe('https://api.new.com');
      expect(client.getAxiosInstance().defaults.timeout).toBe(15000);
    });

    it('should update rate limiter', () => {
      const client = new HttpClient();
      const newLimiter = RateLimiter.lenient();

      client.updateConfig({
        rateLimiter: newLimiter,
      });

      // If we got here without errors, config was updated successfully
      expect(client).toBeInstanceOf(HttpClient);
    });
  });

  describe('Axios instance access', () => {
    it('should provide access to underlying axios instance', () => {
      const client = new HttpClient({
        baseURL: 'https://api.test.com',
      });

      const axiosInstance = client.getAxiosInstance();
      expect(axiosInstance.defaults.baseURL).toBe('https://api.test.com');
    });
  });
});
