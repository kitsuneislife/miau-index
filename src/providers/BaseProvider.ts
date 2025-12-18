import { Anime } from '../models/Anime';
import { Episode } from '../models/Episode';
import { DataSource } from '../types/common';

/**
 * Base interface for anime data providers
 */
export interface IAnimeProvider {
  /**
   * Get the source of this provider
   */
  getSource(): DataSource;

  /**
   * Fetch anime by ID from the external source
   */
  fetchAnimeById(externalId: string): Promise<Anime | null>;

  /**
   * Search anime by title
   */
  searchAnime(query: string, limit?: number): Promise<Anime[]>;

  /**
   * Get seasonal anime
   */
  getSeasonalAnime(year: number, season: string): Promise<Anime[]>;

  /**
   * Fetch episodes for an anime
   */
  fetchEpisodes?(animeId: string, externalId: string): Promise<Episode[]>;

  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Base abstract class for anime providers with common functionality
 */
export abstract class BaseAnimeProvider implements IAnimeProvider {
  protected baseUrl: string;
  protected timeout: number = 10000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  abstract getSource(): DataSource;
  abstract fetchAnimeById(externalId: string): Promise<Anime | null>;
  abstract searchAnime(query: string, limit?: number): Promise<Anime[]>;
  abstract getSeasonalAnime(year: number, season: string): Promise<Anime[]>;

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check - can be overridden
      return true;
    } catch {
      return false;
    }
  }

  protected async fetchWithRetry<T>(fetchFn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetchFn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError || new Error('Fetch failed after retries');
  }
}
