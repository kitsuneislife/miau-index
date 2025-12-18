import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from './logger';
import { RateLimiter } from './rateLimiter';
import { retryWithBackoff } from './helpers';

/**
 * HTTP client configuration options
 */
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  rateLimiter?: RateLimiter;
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

/**
 * Enhanced HTTP client with rate limiting, retries, and logging
 */
export class HttpClient {
  private client: AxiosInstance;
  private rateLimiter?: RateLimiter;
  private maxRetries: number;
  private enableLogging: boolean;
  private logger = new Logger('HttpClient');

  constructor(config: HttpClientConfig = {}) {
    const {
      baseURL = '',
      timeout = 10000,
      headers = {},
      rateLimiter,
      maxRetries = 3,
      enableLogging = false,
    } = config;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    this.rateLimiter = rateLimiter;
    this.maxRetries = maxRetries;
    this.enableLogging = enableLogging;

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        if (this.enableLogging) {
          this.logger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        // Apply rate limiting if configured
        if (this.rateLimiter) {
          await this.rateLimiter.execute('http-request', async () => {
            // Just wait for rate limit permission
          });
        }

        return config;
      },
      (error) => {
        if (this.enableLogging) {
          this.logger.error('Request error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (this.enableLogging) {
          this.logger.debug(`Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        if (this.enableLogging) {
          this.logger.error(`Response error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request with retry logic
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return retryWithBackoff(
      async () => {
        const response: AxiosResponse<T> = await this.client.get(url, config);
        return response.data;
      },
      { maxRetries: this.maxRetries }
    );
  }

  /**
   * POST request with retry logic
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return retryWithBackoff(
      async () => {
        const response: AxiosResponse<T> = await this.client.post(url, data, config);
        return response.data;
      },
      { maxRetries: this.maxRetries }
    );
  }

  /**
   * PUT request with retry logic
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return retryWithBackoff(
      async () => {
        const response: AxiosResponse<T> = await this.client.put(url, data, config);
        return response.data;
      },
      { maxRetries: this.maxRetries }
    );
  }

  /**
   * DELETE request with retry logic
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return retryWithBackoff(
      async () => {
        const response: AxiosResponse<T> = await this.client.delete(url, config);
        return response.data;
      },
      { maxRetries: this.maxRetries }
    );
  }

  /**
   * GraphQL query
   */
  async graphql<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await this.post<{ data: T; errors?: any[] }>('', {
      query,
      variables,
    });

    if (response.errors && response.errors.length > 0) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
    }

    return response.data;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HttpClientConfig>): void {
    if (config.baseURL) {
      this.client.defaults.baseURL = config.baseURL;
    }
    if (config.timeout) {
      this.client.defaults.timeout = config.timeout;
    }
    if (config.headers) {
      this.client.defaults.headers = {
        ...this.client.defaults.headers,
        ...config.headers,
      };
    }
    if (config.rateLimiter !== undefined) {
      this.rateLimiter = config.rateLimiter;
    }
    if (config.maxRetries !== undefined) {
      this.maxRetries = config.maxRetries;
    }
    if (config.enableLogging !== undefined) {
      this.enableLogging = config.enableLogging;
    }
  }

  /**
   * Get the underlying axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}
