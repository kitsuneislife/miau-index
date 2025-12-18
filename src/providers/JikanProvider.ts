import { Anime } from '../models/Anime';
import { Episode } from '../models/Episode';
import { DataSource, AnimeType, AnimeStatus, Season } from '../types/common';
import { BaseAnimeProvider } from './BaseProvider';
import { HttpClient } from '../utils/httpClient';
import { RateLimiter } from '../utils/rateLimiter';
import { CacheService } from '../utils/cache';
import { generateId } from '../utils/helpers';

/**
 * Jikan API response interfaces
 */
interface JikanAnimeData {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  trailer?: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
  };
  approved: boolean;
  titles: Array<{
    type: string;
    title: string;
  }>;
  title: string;
  title_english?: string;
  title_japanese?: string;
  title_synonyms: string[];
  type?: string;
  source?: string;
  episodes?: number;
  status?: string;
  airing: boolean;
  aired: {
    from?: string;
    to?: string;
    prop: {
      from?: { day?: number; month?: number; year?: number };
      to?: { day?: number; month?: number; year?: number };
    };
    string?: string;
  };
  duration?: string;
  rating?: string;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  background?: string;
  season?: string;
  year?: number;
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
    string?: string;
  };
  producers: Array<{ mal_id: number; type: string; name: string; url: string }>;
  licensors: Array<{ mal_id: number; type: string; name: string; url: string }>;
  studios: Array<{ mal_id: number; type: string; name: string; url: string }>;
  genres: Array<{ mal_id: number; type: string; name: string; url: string }>;
  explicit_genres: Array<{ mal_id: number; type: string; name: string; url: string }>;
  themes: Array<{ mal_id: number; type: string; name: string; url: string }>;
  demographics: Array<{ mal_id: number; type: string; name: string; url: string }>;
}

interface JikanEpisodeData {
  mal_id: number;
  url: string;
  title: string;
  title_japanese?: string;
  title_romanji?: string;
  aired?: string;
  score?: number;
  filler: boolean;
  recap: boolean;
  forum_url?: string;
}

interface JikanAnimeResponse {
  data: JikanAnimeData;
}

interface JikanEpisodesResponse {
  data: JikanEpisodeData[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}

/**
 * Jikan (unofficial MAL API) provider with complete API implementation
 * @see https://jikan.moe/
 * @see https://docs.api.jikan.moe/
 */
export class JikanProvider extends BaseAnimeProvider {
  private httpClient: HttpClient;
  private cache: CacheService<Anime | Anime[]>;

  constructor() {
    super('https://api.jikan.moe/v4');

    // Initialize HTTP client with rate limiting (60 req/min, 3 req/sec)
    this.httpClient = new HttpClient({
      baseURL: this.baseUrl,
      timeout: 15000,
      rateLimiter: new RateLimiter({
        maxRequests: 55, // Stay under 60/min limit
        windowMs: 60000, // Per minute
      }),
      maxRetries: 3,
      retryDelay: 2000,
      enableLogging: false,
    });

    // Cache for 24 hours (Jikan caches for 24h)
    this.cache = new CacheService<Anime | Anime[]>(86400000);
  }

  getSource(): DataSource {
    return DataSource.MYANIMELIST; // Jikan is a MAL scraper
  }

  async fetchAnimeById(externalId: string): Promise<Anime | null> {
    const cacheKey = `jikan-anime-${externalId}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !Array.isArray(cached)) {
      return cached;
    }

    try {
      return await this.fetchWithRetry(async () => {
        const url = `/anime/${externalId}`;
        const response = await this.httpClient.get<JikanAnimeResponse>(url);

        if (!response.data) {
          return null;
        }

        const data = response.data;
        const anime = this.mapJikanToAnime(data);

        this.cache.set(cacheKey, anime);
        return anime;
      });
    } catch (error: any) {
      // Handle 404 errors gracefully
      if (error.response?.status === 404 || error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async searchAnime(query: string, limit: number = 10): Promise<Anime[]> {
    const cacheKey = `jikan-search-${query}-${limit}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const url = `/anime?q=${encodeURIComponent(query)}&limit=${limit}&order_by=popularity&sort=asc`;
      const response = await this.httpClient.get<{ data: JikanAnimeData[] }>(url);

      const results = (response.data || []).map((item) => this.mapJikanToAnime(item));

      this.cache.set(cacheKey, results);
      return results;
    });
  }

  async getSeasonalAnime(year: number, season: string): Promise<Anime[]> {
    const cacheKey = `jikan-season-${year}-${season}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const url = `/seasons/${year}/${season.toLowerCase()}`;
      const response = await this.httpClient.get<{ data: JikanAnimeData[] }>(url);

      const results = (response.data || []).map((item) => this.mapJikanToAnime(item));

      this.cache.set(cacheKey, results);
      return results;
    });
  }

  async fetchEpisodes(animeId: string, externalId: string): Promise<Episode[]> {
    return this.fetchWithRetry(async () => {
      const episodes: Episode[] = [];
      let page = 1;
      let hasNextPage = true;

      // Jikan returns episodes in pages of 100
      while (hasNextPage) {
        const url = `/anime/${externalId}/episodes?page=${page}`;
        const response = await this.httpClient.get<JikanEpisodesResponse>(url);

        if (!response.data || response.data.length === 0) {
          break;
        }

        for (const ep of response.data) {
          episodes.push({
            id: `${animeId}-ep-${ep.mal_id}`,
            animeId,
            number: ep.mal_id,
            title: ep.title,
            synopsis: undefined,
            duration: undefined,
            aired: ep.aired ? new Date(ep.aired) : undefined,
            images: undefined,
            filler: ep.filler,
            recap: ep.recap,
            externalIds: [
              {
                source: DataSource.MYANIMELIST,
                id: ep.mal_id.toString(),
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        hasNextPage = response.pagination?.has_next_page ?? false;
        page++;

        // Safety limit to prevent infinite loops
        if (page > 50) {
          break;
        }
      }

      return episodes;
    });
  }

  private mapJikanToAnime(data: JikanAnimeData): Anime {
    const anime: Anime = {
      id: generateId(),
      title: {
        romaji: data.title,
        english: data.title_english,
        native: data.title_japanese,
        synonyms: data.title_synonyms,
      },
      type: this.mapType(data.type),
      status: this.mapStatus(data.status),
      synopsis: data.synopsis,
      images: {
        small: data.images.jpg.small_image_url,
        medium: data.images.jpg.image_url,
        large: data.images.jpg.large_image_url,
        original: data.images.jpg.large_image_url,
      },
      episodes: data.episodes,
      aired: {
        start: data.aired?.from ? new Date(data.aired.from) : undefined,
        end: data.aired?.to ? new Date(data.aired.to) : undefined,
      },
      season: data.season ? this.mapSeason(data.season) : undefined,
      year: data.year,
      ratings: [
        {
          source: DataSource.MYANIMELIST,
          score: data.score,
          votes: data.scored_by,
          rank: data.rank,
          popularity: data.popularity,
        },
      ],
      genres: data.genres?.map((g) => g.name) || [],
      themes: data.themes?.map((t) => t.name) || [],
      demographics: data.demographics?.map((d) => d.name) || [],
      studios: data.studios?.map((s) => s.name) || [],
      producers: data.producers?.map((p) => p.name) || [],
      licensors: data.licensors?.map((l) => l.name) || [],
      externalIds: [
        {
          source: DataSource.MYANIMELIST,
          id: data.mal_id.toString(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    };

    return anime;
  }

  private mapSeason(season: string): Season {
    const seasonMap: Record<string, Season> = {
      winter: Season.WINTER,
      spring: Season.SPRING,
      summer: Season.SUMMER,
      fall: Season.FALL,
    };

    return seasonMap[season.toLowerCase()] || Season.WINTER;
  }

  private mapType(type?: string): AnimeType {
    const typeMap: Record<string, AnimeType> = {
      TV: AnimeType.TV,
      OVA: AnimeType.OVA,
      ONA: AnimeType.ONA,
      Movie: AnimeType.MOVIE,
      Special: AnimeType.SPECIAL,
      Music: AnimeType.MUSIC,
    };

    return type && typeMap[type] ? typeMap[type] : AnimeType.TV;
  }

  private mapStatus(status?: string): AnimeStatus {
    const statusMap: Record<string, AnimeStatus> = {
      'Currently Airing': AnimeStatus.AIRING,
      'Finished Airing': AnimeStatus.FINISHED,
      'Not yet aired': AnimeStatus.NOT_YET_AIRED,
    };

    return status && statusMap[status] ? statusMap[status] : AnimeStatus.FINISHED;
  }
}
