import { Anime } from '../models/Anime';
import { Episode } from '../models/Episode';
import { DataSource, AnimeType, AnimeStatus } from '../types/common';
import { BaseAnimeProvider } from './BaseProvider';
import { HttpClient } from '../utils/httpClient';
import { RateLimiter } from '../utils/rateLimiter';
import { CacheService } from '../utils/cache';
import { generateId } from '../utils/helpers';

/**
 * MyAnimeList API response interfaces
 */
interface MALAnimeNode {
  id: number;
  title: string;
  main_picture?: {
    medium: string;
    large: string;
  };
  alternative_titles?: {
    synonyms: string[];
    en?: string;
    ja?: string;
  };
  start_date?: string;
  end_date?: string;
  synopsis?: string;
  mean?: number;
  rank?: number;
  popularity?: number;
  num_list_users?: number;
  num_scoring_users?: number;
  nsfw?: string;
  media_type?: string;
  status?: string;
  genres?: Array<{ id: number; name: string }>;
  num_episodes?: number;
  start_season?: {
    year: number;
    season: string;
  };
  broadcast?: {
    day_of_the_week: string;
    start_time?: string;
  };
  source?: string;
  average_episode_duration?: number;
  rating?: string;
  studios?: Array<{ id: number; name: string }>;
}

/**
 * MyAnimeList provider with complete API implementation
 */
export class MyAnimeListProvider extends BaseAnimeProvider {
  private httpClient: HttpClient;
  private cache: CacheService<Anime | Anime[]>;

  constructor(apiKey: string) {
    super('https://api.myanimelist.net/v2');

    // Initialize HTTP client with rate limiting (60 requests per minute)
    this.httpClient = new HttpClient({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'X-MAL-CLIENT-ID': apiKey,
      },
      rateLimiter: RateLimiter.strict(),
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: false,
    });

    // Cache for 1 hour
    this.cache = new CacheService<Anime | Anime[]>(3600000);
  }

  getSource(): DataSource {
    return DataSource.MYANIMELIST;
  }

  async fetchAnimeById(externalId: string): Promise<Anime | null> {
    const cacheKey = `mal-anime-${externalId}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const fields = [
        'id',
        'title',
        'main_picture',
        'alternative_titles',
        'start_date',
        'end_date',
        'synopsis',
        'mean',
        'rank',
        'popularity',
        'num_list_users',
        'num_scoring_users',
        'nsfw',
        'media_type',
        'status',
        'genres',
        'num_episodes',
        'start_season',
        'broadcast',
        'source',
        'average_episode_duration',
        'rating',
        'studios',
      ].join(',');

      const data = await this.httpClient.get<MALAnimeNode>(`/anime/${externalId}`, {
        params: { fields },
      });

      const anime = this.mapMALToAnime(data);

      // Cache the result
      this.cache.set(cacheKey, anime);

      return anime;
    });
  }

  async searchAnime(query: string, limit: number = 10): Promise<Anime[]> {
    const cacheKey = `mal-search-${query}-${limit}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const data = await this.httpClient.get<{ data: Array<{ node: MALAnimeNode }> }>('/anime', {
        params: {
          q: query,
          limit,
          fields: 'id,title,main_picture,start_date,media_type,status,mean',
        },
      });

      const results = data.data.map((item) => this.mapMALToAnime(item.node));

      // Cache the results
      this.cache.set(cacheKey, results);

      return results;
    });
  }

  async getSeasonalAnime(year: number, season: string): Promise<Anime[]> {
    const cacheKey = `mal-seasonal-${year}-${season}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const data = await this.httpClient.get<{ data: Array<{ node: MALAnimeNode }> }>(
        `/anime/season/${year}/${season}`,
        {
          params: {
            limit: 100,
            fields: 'id,title,main_picture,start_date,media_type,status,mean',
          },
        }
      );

      const results = data.data.map((item) => this.mapMALToAnime(item.node));

      // Cache for longer (6 hours for seasonal data)
      this.cache.set(cacheKey, results, { ttl: 21600000 });

      return results;
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.httpClient.get('/anime/1', {
        params: { fields: 'id' },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Map MAL API response to internal Anime model
   */
  private mapMALToAnime(data: MALAnimeNode): Anime {
    const anime: Anime = {
      id: generateId(),
      title: {
        romaji: data.title,
        english: data.alternative_titles?.en,
        native: data.alternative_titles?.ja,
        synonyms: data.alternative_titles?.synonyms,
      },
      type: this.mapMediaType(data.media_type),
      status: this.mapStatus(data.status),
      images: {
        small: data.main_picture?.medium,
        medium: data.main_picture?.medium,
        large: data.main_picture?.large,
        original: data.main_picture?.large,
      },
      ratings: data.mean
        ? [
            {
              source: DataSource.MYANIMELIST,
              score: data.mean,
              votes: data.num_scoring_users,
            },
          ]
        : [],
      synopsis: data.synopsis,
      genres: data.genres?.map((g) => g.name) || [],
      themes: [],
      studios: data.studios?.map((s) => s.name) || [],
      producers: [],
      licensors: [],
      externalIds: [
        {
          source: DataSource.MYANIMELIST,
          id: data.id.toString(),
        },
      ],
      episodes: data.num_episodes,
      aired: {
        start: data.start_date ? new Date(data.start_date) : undefined,
        end: data.end_date ? new Date(data.end_date) : undefined,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    };

    return anime;
  }

  /**
   * Map MAL media type to internal AnimeType
   */
  private mapMediaType(type?: string): AnimeType {
    const typeMap: Record<string, AnimeType> = {
      tv: AnimeType.TV,
      ova: AnimeType.OVA,
      movie: AnimeType.MOVIE,
      special: AnimeType.SPECIAL,
      ona: AnimeType.ONA,
      music: AnimeType.MUSIC,
    };

    return typeMap[type?.toLowerCase() || ''] || AnimeType.TV;
  }

  /**
   * Map MAL status to internal AnimeStatus
   */
  private mapStatus(status?: string): AnimeStatus {
    const statusMap: Record<string, AnimeStatus> = {
      finished_airing: AnimeStatus.FINISHED,
      currently_airing: AnimeStatus.AIRING,
      not_yet_aired: AnimeStatus.NOT_YET_AIRED,
    };

    return statusMap[status?.toLowerCase() || ''] || AnimeStatus.NOT_YET_AIRED;
  }

  /**
   * Fetch episodes for an anime from MAL
   * Note: MAL API has limited episode data, mainly provides count
   */
  async fetchEpisodes(animeId: string, externalId: string): Promise<Episode[]> {
    return this.fetchWithRetry(async () => {
      // MAL API provides basic episode information
      const url = `${this.baseUrl}/anime/${externalId}?fields=num_episodes,start_date,broadcast,average_episode_duration`;
      const data = await this.httpClient.get<MALAnimeNode>(url);

      const episodes: Episode[] = [];
      const totalEpisodes = data.num_episodes || 0;

      // Create basic episode entries (MAL doesn't provide detailed episode info via API)
      for (let i = 1; i <= totalEpisodes; i++) {
        episodes.push({
          id: `${animeId}-ep-${i}`,
          animeId,
          number: i,
          duration: data.average_episode_duration,
          externalIds: [
            {
              source: DataSource.MYANIMELIST,
              id: `${externalId}-${i}`,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return episodes;
    });
  }
}

/**
 * AniList provider with GraphQL implementation
 */
export class AniListProvider extends BaseAnimeProvider {
  private httpClient: HttpClient;
  private cache: CacheService<Anime | Anime[]>;

  constructor() {
    super('https://graphql.anilist.co');

    // Initialize HTTP client with rate limiting (90 requests per minute for AniList)
    this.httpClient = new HttpClient({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      rateLimiter: RateLimiter.strict(),
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: false,
    });

    // Cache for 1 hour
    this.cache = new CacheService<Anime | Anime[]>(3600000);
  }

  getSource(): DataSource {
    return DataSource.ANILIST;
  }

  async fetchAnimeById(externalId: string): Promise<Anime | null> {
    const cacheKey = `anilist-anime-${externalId}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const query = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            format
            status
            description
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            episodes
            duration
            coverImage {
              extraLarge
              large
              medium
            }
            bannerImage
            genres
            tags {
              name
              rank
            }
            averageScore
            meanScore
            popularity
            favourites
            studios {
              nodes {
                id
                name
              }
            }
            externalLinks {
              url
              site
            }
          }
        }
      `;

      const variables = { id: parseInt(externalId) };
      const data = await this.httpClient.graphql<{ Media: any }>(query, variables);

      const anime = this.mapAniListToAnime(data.Media);

      // Cache the result
      this.cache.set(cacheKey, anime);

      return anime;
    });
  }

  async searchAnime(query: string, limit: number = 10): Promise<Anime[]> {
    const cacheKey = `anilist-search-${query}-${limit}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const gqlQuery = `
        query ($search: String, $perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            media(search: $search, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              format
              status
              description
              coverImage {
                large
                medium
              }
              averageScore
              popularity
              genres
            }
          }
        }
      `;

      const variables = { search: query, perPage: limit };
      const data = await this.httpClient.graphql<{ Page: { media: any[] } }>(gqlQuery, variables);

      const results = data.Page.media.map((item) => this.mapAniListToAnime(item));

      // Cache the results
      this.cache.set(cacheKey, results);

      return results;
    });
  }

  async getSeasonalAnime(year: number, season: string): Promise<Anime[]> {
    const cacheKey = `anilist-seasonal-${year}-${season}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const query = `
        query ($season: MediaSeason, $year: Int, $perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) {
              id
              title {
                romaji
                english
                native
              }
              format
              status
              coverImage {
                large
                medium
              }
              averageScore
              popularity
              genres
            }
          }
        }
      `;

      const variables = {
        season: season.toUpperCase(),
        year,
        perPage: 100,
      };

      const data = await this.httpClient.graphql<{ Page: { media: any[] } }>(query, variables);

      const results = data.Page.media.map((item) => this.mapAniListToAnime(item));

      // Cache for longer (6 hours for seasonal data)
      this.cache.set(cacheKey, results, { ttl: 21600000 });

      return results;
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const query = `{ Media(id: 1, type: ANIME) { id } }`;
      await this.httpClient.graphql(query);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Map AniList API response to internal Anime model
   */
  private mapAniListToAnime(data: any): Anime {
    const anime: Anime = {
      id: generateId(),
      title: {
        romaji: data.title?.romaji,
        english: data.title?.english,
        native: data.title?.native,
      },
      type: this.mapFormat(data.format),
      status: this.mapStatus(data.status),
      images: {
        small: data.coverImage?.medium,
        medium: data.coverImage?.large,
        large: data.coverImage?.extraLarge || data.coverImage?.large,
        original: data.coverImage?.extraLarge || data.coverImage?.large,
      },
      ratings: data.averageScore
        ? [
            {
              source: DataSource.ANILIST,
              score: data.averageScore / 10, // AniList uses 0-100 scale
              votes: data.favourites,
            },
          ]
        : [],
      synopsis: data.description,
      genres: data.genres || [],
      themes: data.tags?.filter((t: any) => t.rank >= 70).map((t: any) => t.name) || [],
      studios: data.studios?.nodes?.map((s: any) => ({ id: generateId(), name: s.name })) || [],
      producers: [],
      licensors: [],
      externalIds: [
        {
          source: DataSource.ANILIST,
          id: data.id.toString(),
        },
      ],
      episodes: data.episodes,
      aired: {
        start: this.parseAniListDate(data.startDate),
        end: this.parseAniListDate(data.endDate),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    };

    return anime;
  }

  /**
   * Map AniList format to internal AnimeType
   */
  private mapFormat(format?: string): AnimeType {
    const formatMap: Record<string, AnimeType> = {
      TV: AnimeType.TV,
      TV_SHORT: AnimeType.TV,
      MOVIE: AnimeType.MOVIE,
      SPECIAL: AnimeType.SPECIAL,
      OVA: AnimeType.OVA,
      ONA: AnimeType.ONA,
      MUSIC: AnimeType.MUSIC,
    };

    return formatMap[format || ''] || AnimeType.TV;
  }

  /**
   * Map AniList status to internal AnimeStatus
   */
  private mapStatus(status?: string): AnimeStatus {
    const statusMap: Record<string, AnimeStatus> = {
      FINISHED: AnimeStatus.FINISHED,
      RELEASING: AnimeStatus.AIRING,
      NOT_YET_RELEASED: AnimeStatus.NOT_YET_AIRED,
      CANCELLED: AnimeStatus.CANCELLED,
    };

    return statusMap[status || ''] || AnimeStatus.NOT_YET_AIRED;
  }

  /**
   * Parse AniList date object to JavaScript Date
   */
  private parseAniListDate(date?: {
    year?: number;
    month?: number;
    day?: number;
  }): Date | undefined {
    if (!date || !date.year) return undefined;

    const year = date.year;
    const month = (date.month || 1) - 1; // JavaScript months are 0-indexed
    const day = date.day || 1;

    return new Date(year, month, day);
  }

  /**
   * Fetch episodes for an anime from AniList
   */
  async fetchEpisodes(animeId: string, externalId: string): Promise<Episode[]> {
    const cacheKey = `anilist-episodes-${externalId}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0 && 'animeId' in cached[0]) {
      return cached as any as Episode[];
    }

    return this.fetchWithRetry(async () => {
      const query = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            episodes
            streamingEpisodes {
              title
              thumbnail
              url
            }
            airingSchedule {
              nodes {
                episode
                airingAt
              }
            }
          }
        }
      `;

      const variables = { id: parseInt(externalId) };
      const data = await this.httpClient.graphql<{ Media: any }>(query, variables);

      const episodes: Episode[] = [];
      const totalEpisodes = data.Media.episodes || 0;
      const airingSchedule = data.Media.airingSchedule?.nodes || [];
      const streamingEpisodes = data.Media.streamingEpisodes || [];

      // Create episode list from total count and available metadata
      for (let i = 1; i <= totalEpisodes; i++) {
        const airingInfo = airingSchedule.find((s: any) => s.episode === i);
        const streamingInfo = streamingEpisodes.find((_: any, idx: number) => idx + 1 === i);

        episodes.push({
          id: `${animeId}-ep-${i}`,
          animeId,
          number: i,
          title: streamingInfo?.title,
          aired: airingInfo ? new Date(airingInfo.airingAt * 1000) : undefined,
          externalIds: [
            {
              source: DataSource.ANILIST,
              id: `${externalId}-${i}`,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return episodes;
    });
  }
}

/**
 * Kitsu API response interfaces
 */
interface KitsuAnimeData {
  id: string;
  type: string;
  attributes: {
    slug: string;
    canonicalTitle: string;
    titles: {
      en?: string;
      en_jp?: string;
      ja_jp?: string;
    };
    synopsis?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    ageRating?: string;
    subtype?: string;
    status?: string;
    posterImage?: {
      tiny?: string;
      small?: string;
      medium?: string;
      large?: string;
      original?: string;
    };
    episodeCount?: number;
    episodeLength?: number;
    averageRating?: string;
    userCount?: number;
    favoritesCount?: number;
    popularityRank?: number;
    ratingRank?: number;
  };
}

interface KitsuResponse {
  data: KitsuAnimeData | KitsuAnimeData[];
}

/**
 * Kitsu provider with complete API implementation
 */
export class KitsuProvider extends BaseAnimeProvider {
  private httpClient: HttpClient;
  private cache: CacheService<Anime | Anime[]>;

  constructor() {
    super('https://kitsu.io/api/edge');

    // Initialize HTTP client with rate limiting (50 requests per minute)
    this.httpClient = new HttpClient({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      rateLimiter: RateLimiter.moderate(),
      maxRetries: 3,
      enableLogging: false,
    });

    // Cache for 1 hour
    this.cache = new CacheService<Anime | Anime[]>(3600000);
  }

  getSource(): DataSource {
    return DataSource.KITSU;
  }

  async fetchAnimeById(externalId: string): Promise<Anime | null> {
    const cacheKey = `kitsu-anime-${externalId}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const data = await this.httpClient.get<KitsuResponse>(`/anime/${externalId}`);

      if (!data.data || Array.isArray(data.data)) {
        return null;
      }

      const anime = this.mapKitsuToAnime(data.data);

      // Cache the result
      this.cache.set(cacheKey, anime);

      return anime;
    });
  }

  async searchAnime(query: string, limit: number = 10): Promise<Anime[]> {
    const cacheKey = `kitsu-search-${query}-${limit}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      const data = await this.httpClient.get<KitsuResponse>('/anime', {
        params: {
          'filter[text]': query,
          'page[limit]': limit,
          'page[offset]': 0,
        },
      });

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      const results = data.data.map((item) => this.mapKitsuToAnime(item));

      // Cache the results
      this.cache.set(cacheKey, results);

      return results;
    });
  }

  async getSeasonalAnime(year: number, season: string): Promise<Anime[]> {
    const cacheKey = `kitsu-seasonal-${year}-${season}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    return this.fetchWithRetry(async () => {
      // Kitsu uses season and seasonYear parameters
      const data = await this.httpClient.get<KitsuResponse>('/anime', {
        params: {
          'filter[seasonYear]': year,
          'filter[season]': season,
          'page[limit]': 100,
          'page[offset]': 0,
          sort: '-userCount',
        },
      });

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      const results = data.data.map((item) => this.mapKitsuToAnime(item));

      // Cache for longer (6 hours for seasonal data)
      this.cache.set(cacheKey, results, { ttl: 21600000 });

      return results;
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.httpClient.get('/anime', {
        params: { 'page[limit]': 1 },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Map Kitsu API response to internal Anime model
   */
  private mapKitsuToAnime(data: KitsuAnimeData): Anime {
    const anime: Anime = {
      id: generateId(),
      title: {
        romaji: data.attributes.titles?.en_jp,
        english: data.attributes.titles?.en || data.attributes.canonicalTitle,
        native: data.attributes.titles?.ja_jp,
      },
      type: this.mapSubtype(data.attributes.subtype),
      status: this.mapStatus(data.attributes.status),
      images: {
        small: data.attributes.posterImage?.small,
        medium: data.attributes.posterImage?.medium,
        large: data.attributes.posterImage?.large,
        original: data.attributes.posterImage?.original,
      },
      ratings: data.attributes.averageRating
        ? [
            {
              source: DataSource.KITSU,
              score: parseFloat(data.attributes.averageRating) / 10, // Kitsu uses 0-100 scale
              votes: data.attributes.userCount,
            },
          ]
        : [],
      synopsis: data.attributes.synopsis || data.attributes.description,
      genres: [],
      themes: [],
      studios: [],
      producers: [],
      licensors: [],
      externalIds: [
        {
          source: DataSource.KITSU,
          id: data.id,
        },
      ],
      episodes: data.attributes.episodeCount,
      duration: data.attributes.episodeLength,
      aired: {
        start: data.attributes.startDate ? new Date(data.attributes.startDate) : undefined,
        end: data.attributes.endDate ? new Date(data.attributes.endDate) : undefined,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    };

    return anime;
  }

  /**
   * Map Kitsu subtype to internal AnimeType
   */
  private mapSubtype(subtype?: string): AnimeType {
    const typeMap: Record<string, AnimeType> = {
      TV: AnimeType.TV,
      movie: AnimeType.MOVIE,
      OVA: AnimeType.OVA,
      ONA: AnimeType.ONA,
      special: AnimeType.SPECIAL,
      music: AnimeType.MUSIC,
    };

    return typeMap[subtype || ''] || AnimeType.TV;
  }

  /**
   * Map Kitsu status to internal AnimeStatus
   */
  private mapStatus(status?: string): AnimeStatus {
    const statusMap: Record<string, AnimeStatus> = {
      finished: AnimeStatus.FINISHED,
      current: AnimeStatus.AIRING,
      upcoming: AnimeStatus.NOT_YET_AIRED,
      unreleased: AnimeStatus.NOT_YET_AIRED,
    };

    return statusMap[status?.toLowerCase() || ''] || AnimeStatus.NOT_YET_AIRED;
  }

  /**
   * Fetch episodes for an anime from Kitsu
   */
  async fetchEpisodes(animeId: string, externalId: string): Promise<Episode[]> {
    const cacheKey = `kitsu-episodes-${externalId}`;

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0 && 'animeId' in cached[0]) {
      return cached as any as Episode[];
    }

    return this.fetchWithRetry(async () => {
      // Kitsu has episodes API endpoint
      const url = `${this.baseUrl}/anime/${externalId}/episodes?page[limit]=20&page[offset]=0`;
      const response = await this.httpClient.get<{ data: any[] }>(url);

      const episodes: Episode[] = [];

      for (const ep of response.data || []) {
        episodes.push({
          id: `${animeId}-ep-${ep.attributes.number}`,
          animeId,
          number: ep.attributes.number,
          title: ep.attributes.canonicalTitle || ep.attributes.titles?.en,
          synopsis: ep.attributes.synopsis || ep.attributes.description,
          duration: ep.attributes.length,
          aired: ep.attributes.airdate ? new Date(ep.attributes.airdate) : undefined,
          images: ep.attributes.thumbnail
            ? {
                small: ep.attributes.thumbnail.small,
                medium: ep.attributes.thumbnail.medium || ep.attributes.thumbnail.small,
                large: ep.attributes.thumbnail.large || ep.attributes.thumbnail.original,
                original: ep.attributes.thumbnail.original,
              }
            : undefined,
          externalIds: [
            {
              source: DataSource.KITSU,
              id: ep.id,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return episodes;
    });
  }
}
