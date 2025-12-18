import { NyaaScraper } from '@kitsuneislife/nyaa';
import type { NyaaTorrent, SearchOptions } from '@kitsuneislife/nyaa';
import { v4 as uuidv4 } from 'uuid';
import {
  Torrent,
  TorrentQuality,
  TorrentLanguage,
  TorrentCodec,
  TorrentReleaseType,
  TorrentMetadata,
  TorrentSearchFilter,
  TorrentStats,
  EpisodeRange,
} from '../models/Torrent';
import { Anime } from '../models/Anime';
import { ITorrentRepository } from '../repositories/TorrentRepository';
import { Logger } from '../utils/logger';
import { CacheService } from '../utils/cache';
import { retryWithBackoff } from '../utils/helpers';
import {
  sanitizeSearchQuery,
  isValidEpisodeNumber,
} from '../utils/torrentValidation';
import { ProviderError } from '../utils/errors';

/**
 * Options for Nyaa service
 */
export interface NyaaServiceOptions {
  /** Auto-index new torrents when searching anime */
  autoIndex?: boolean;
  /** Minimum seeders to consider a torrent */
  minSeeders?: number;
  /** Only index trusted uploaders */
  trustedOnly?: boolean;
  /** Maximum results per search */
  maxResults?: number;
  /** Default quality preference */
  preferredQuality?: TorrentQuality;
  /** Default language preference */
  preferredLanguages?: TorrentLanguage[];
  /** Enable caching of search results (default: true) */
  enableCache?: boolean;
  /** Cache TTL in milliseconds (default: 1 hour) */
  cacheTTL?: number;
  /** Request timeout in milliseconds (default: 30s) */
  timeout?: number;
  /** Maximum retry attempts on failure (default: 3) */
  maxRetries?: number;
}

/**
 * Service for indexing and managing anime torrents from Nyaa
 */
export class NyaaService {
  private logger: Logger;
  private nyaa: NyaaScraper;
  private options: Required<NyaaServiceOptions>;
  private searchCache?: CacheService<NyaaTorrent[]>;
  private metrics = {
    totalSearches: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalTorrentsIndexed: 0,
    failedSearches: 0,
  };

  constructor(
    private torrentRepository: ITorrentRepository,
    options: NyaaServiceOptions = {},
    // optional repositories for associating seasons/episodes
    private episodeRepository?: import('../repositories/EpisodeRepository').IEpisodeRepository,
    private seasonRepository?: import('../repositories/EpisodeRepository').ISeasonRepository,
  ) {
    this.logger = new Logger('NyaaService');
    this.nyaa = new NyaaScraper({
      timeout: options.timeout ?? 30000,
      retry: {
        maxRetries: options.maxRetries ?? 3,
      },
    });
    this.options = {
      autoIndex: options.autoIndex ?? true,
      minSeeders: options.minSeeders ?? 1,
      trustedOnly: options.trustedOnly ?? false,
      maxResults: options.maxResults ?? 100,
      preferredQuality: options.preferredQuality ?? TorrentQuality.FULL_HD_1080p,
      preferredLanguages: options.preferredLanguages ?? [
        TorrentLanguage.JAPANESE,
        TorrentLanguage.ENGLISH,
      ],
      enableCache: options.enableCache ?? true,
      cacheTTL: options.cacheTTL ?? 3600000, // 1 hour
      timeout: options.timeout ?? 30000,
      maxRetries: options.maxRetries ?? 3,
    };

    // Initialize cache if enabled
    if (this.options.enableCache) {
      this.searchCache = new CacheService<NyaaTorrent[]>(this.options.cacheTTL);
      this.logger.debug('Search cache enabled with TTL:', this.options.cacheTTL);
    }
  }

  /**
   * Extract season number from title (e.g. S01, Season 1, S1E12, S01E12)
   */
  private extractSeasonNumber(title: string): number | undefined {
    const patterns = [/[Ss](\d{1,2})[Ee]\d{1,3}/, /Season\s*(\d{1,2})/i, /[Ss](\d{1,2})\b/];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) return parseInt(match[1], 10);
    }

    return undefined;
  }

  /**
   * Index torrents for an anime
   */
  async indexAnime(anime: Anime): Promise<Torrent[]> {
    const startTime = Date.now();
    this.logger.info(
      `Indexing torrents for anime: ${anime.title.romaji || anime.title.english}`,
    );

    try {
      const searchQueries = this.buildSearchQueries(anime);
      const allTorrents: Torrent[] = [];

      for (const query of searchQueries) {
        const sanitizedQuery = sanitizeSearchQuery(query);
        this.logger.debug(`Searching Nyaa with query: ${sanitizedQuery}`);
        
        const results = await this.searchNyaa(sanitizedQuery);

        const mapped = await Promise.all(
          results.map(async (result) => {
            try {
              const t = await this.mapNyaaResultToTorrent(result, anime);
              return t;
            } catch (error) {
              this.logger.warn(`Failed to map torrent: ${result.title}`, error);
              return null;
            }
          }),
        );

        const torrents = mapped.filter((t): t is Torrent => t !== null && this.isValidTorrent(t));

        allTorrents.push(...torrents);
      }

      // Remove duplicates by infoHash
      const uniqueTorrents = this.deduplicateTorrents(allTorrents);

      // Save to repository
      if (this.options.autoIndex && uniqueTorrents.length > 0) {
        await this.torrentRepository.saveMany(uniqueTorrents);
        this.metrics.totalTorrentsIndexed += uniqueTorrents.length;
      }

      const duration = Date.now() - startTime;
      this.logger.info(
        `Indexed ${uniqueTorrents.length} torrents for anime: ${anime.id} (${duration}ms)`,
      );

      return uniqueTorrents;
    } catch (error) {
      this.metrics.failedSearches++;
      this.logger.error('Error indexing anime torrents:', error);
      throw new ProviderError('Nyaa', `Failed to index anime: ${error}`);
    }
  }

  /**
   * Index torrents for specific episode
   */
  async indexEpisode(anime: Anime, episodeNumber: number): Promise<Torrent[]> {
    if (!isValidEpisodeNumber(episodeNumber)) {
      throw new Error(`Invalid episode number: ${episodeNumber}`);
    }

    const startTime = Date.now();
    this.logger.info(`Indexing torrents for episode ${episodeNumber} of ${anime.title.romaji}`);

    try {
      const query = this.buildEpisodeQuery(anime, episodeNumber);
      const sanitizedQuery = sanitizeSearchQuery(query);
      const results = await this.searchNyaa(sanitizedQuery);

      const mapped = await Promise.all(
        results.map(async (result) => {
          try {
            const t = await this.mapNyaaResultToTorrent(result, anime, episodeNumber);
            return t;
          } catch (error) {
            this.logger.warn(`Failed to map torrent: ${result.title}`, error);
            return null;
          }
        }),
      );

      const torrents = mapped.filter((t): t is Torrent => t !== null && this.isValidTorrent(t));

      if (this.options.autoIndex && torrents.length > 0) {
        await this.torrentRepository.saveMany(torrents);
        this.metrics.totalTorrentsIndexed += torrents.length;
      }

      const duration = Date.now() - startTime;
      this.logger.info(
        `Indexed ${torrents.length} torrents for episode ${episodeNumber} (${duration}ms)`,
      );

      return torrents;
    } catch (error) {
      this.metrics.failedSearches++;
      this.logger.error('Error indexing episode torrents:', error);
      throw new ProviderError('Nyaa', `Failed to index episode: ${error}`);
    }
  }

  /**
   * Search torrents for an anime with filters
   */
  async searchTorrents(anime: Anime, filters?: TorrentSearchFilter): Promise<Torrent[]> {
    const searchFilters: TorrentSearchFilter = {
      animeId: anime.id,
      ...filters,
    };

    return this.torrentRepository.findByFilters(searchFilters);
  }

  /**
   * Get best torrent for episode (highest quality with good seeders)
   */
  async getBestTorrentForEpisode(
    anime: Anime,
    episodeNumber: number,
    preferredQuality?: TorrentQuality
  ): Promise<Torrent | null> {
    const torrents = await this.torrentRepository.findByFilters({
      animeId: anime.id,
      episodeNumber,
      minSeeders: this.options.minSeeders,
      trustedOnly: this.options.trustedOnly,
    });

    if (torrents.length === 0) return null;

    const quality = preferredQuality ?? this.options.preferredQuality;

    // Try to find exact quality match
    const exactMatch = torrents.find((t) => t.metadata.quality === quality);
    if (exactMatch) return exactMatch;

    // Fallback to best available (by seeders)
    return torrents[0]; // Already sorted by seeders
  }

  /**
   * Get torrent statistics for an anime
   */
  async getTorrentStats(animeId: string): Promise<TorrentStats> {
    const torrents = await this.torrentRepository.findByAnimeId(animeId);

    const stats: TorrentStats = {
      totalTorrents: torrents.length,
      byQuality: {} as Record<TorrentQuality, number>,
      byLanguage: {} as Record<TorrentLanguage, number>,
      byReleaseType: {} as Record<TorrentReleaseType, number>,
      averageSeeders: 0,
      totalSize: 0,
    };

    if (torrents.length === 0) return stats;

    torrents.forEach((torrent) => {
      // By quality
      stats.byQuality[torrent.metadata.quality] =
        (stats.byQuality[torrent.metadata.quality] ?? 0) + 1;

      // By language
      torrent.metadata.audioLanguages.forEach((lang) => {
        stats.byLanguage[lang] = (stats.byLanguage[lang] ?? 0) + 1;
      });

      // By release type
      stats.byReleaseType[torrent.metadata.releaseType] =
        (stats.byReleaseType[torrent.metadata.releaseType] ?? 0) + 1;

      // Size
      stats.totalSize += torrent.sizeBytes;
    });

    stats.averageSeeders = torrents.reduce((sum, t) => sum + t.seeders, 0) / torrents.length;

    return stats;
  }

  /**
   * Refresh torrent info (seeders, leechers)
   */
  async refreshTorrent(torrentId: string): Promise<Torrent | null> {
    const torrent = await this.torrentRepository.findById(torrentId);
    if (!torrent) return null;

    try {
      const results = await this.searchNyaa(torrent.nyaaId);
      if (results.length === 0) return torrent;

      const updated = this.updateTorrentFromNyaaResult(torrent, results[0]);
      return this.torrentRepository.save(updated);
    } catch (error) {
      this.logger.error('Error refreshing torrent:', error);
      return torrent;
    }
  }

  /**
   * Build search queries for anime
   */
  private buildSearchQueries(anime: Anime): string[] {
    const queries: string[] = [];

    // Romaji title
    if (anime.title.romaji) {
      queries.push(anime.title.romaji);
    }

    // English title
    if (anime.title.english && anime.title.english !== anime.title.romaji) {
      queries.push(anime.title.english);
    }

    // Native title
    if (anime.title.native && !queries.includes(anime.title.native)) {
      queries.push(anime.title.native);
    }

    return queries;
  }

  /**
   * Build query for specific episode
   */
  private buildEpisodeQuery(anime: Anime, episodeNumber: number): string {
    const title = anime.title.romaji || anime.title.english || '';
    return `${title} ${episodeNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Search Nyaa with query (with caching and retry)
   */
  private async searchNyaa(query: string): Promise<NyaaTorrent[]> {
    this.metrics.totalSearches++;

    // Check cache first
    if (this.searchCache) {
      const cached = this.searchCache.get(query);
      if (cached) {
        this.metrics.cacheHits++;
        this.logger.debug(`Cache hit for query: ${query}`);
        return cached;
      }
      this.metrics.cacheMisses++;
    }

    // Search with retry logic
    const options: SearchOptions = {
      query,
      category: '1_2', // Anime - English-translated
      filter: this.options.trustedOnly ? 'trusted-only' : 'no-filter',
      sortBy: 'seeders',
      order: 'desc',
    };

    try {
      const result = await retryWithBackoff(
        async () => {
          const searchResult = await this.nyaa.search(options);
          return searchResult.torrents;
        },
        {
          maxRetries: this.options.maxRetries,
          initialDelay: 1000,
        },
      );

      // Cache the result
      if (this.searchCache) {
        this.searchCache.set(query, result);
      }

      return result;
    } catch (error) {
      this.logger.error(`Search failed for query: ${query}`, error);
      throw new ProviderError('Nyaa', `Search failed: ${error}`);
    }
  }

  /**
   * Map Nyaa result to Torrent model
   */
  private async mapNyaaResultToTorrent(
    result: NyaaTorrent,
    anime: Anime,
    episodeNumber?: number
  ): Promise<Torrent> {
    const metadata = this.extractMetadata(result.title);
    const episodeRange = this.extractEpisodeRange(result.title);
    const extractedEpisode = episodeNumber ?? this.extractEpisodeNumber(result.title);
    const extractedSeason = this.extractSeasonNumber(result.title);

    const torrent: Torrent = {
      id: uuidv4(),
      nyaaId: result.id,
      title: result.title,
      category: result.category,
      magnetLink: result.magnetLink,
      torrentLink: result.torrentLink,
      infoHash: this.extractInfoHash(result.magnetLink),
      size: result.size,
      sizeBytes: this.parseSizeToBytes(result.size),
      seeders: result.seeders,
      leechers: result.leechers,
      downloads: result.downloads,
      publishedAt: new Date(result.date),
      animeId: anime.id,
      episodeNumber: extractedEpisode,
      episodeRange,
      metadata,
      trusted: result.isTrusted,
      remake: result.isRemake,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If we have a season number and a season repository, link or create the season
    if (extractedSeason && this.seasonRepository) {
      try {
        let season = await this.seasonRepository.findBySeasonNumber(anime.id, extractedSeason);
        if (!season) {
          season = {
            id: uuidv4(),
            animeId: anime.id,
            seasonNumber: extractedSeason,
            title: undefined,
            episodeCount: undefined,
            episodes: [],
            aired: {},
            externalIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          season = await this.seasonRepository.save(season);
        }
        torrent.seasonId = season.id;
      } catch (e) {
        this.logger.warn('Failed to associate season for torrent:', result.title, e);
      }
    }

    // If we have an episode number and an episode repository, link or create the episode
    if (extractedEpisode && this.episodeRepository) {
      try {
        let ep = await this.episodeRepository.findByNumber(anime.id, extractedEpisode);
        if (!ep) {
          ep = {
            id: uuidv4(),
            animeId: anime.id,
            number: extractedEpisode,
            title: undefined,
            titleJapanese: undefined,
            titleRomaji: undefined,
            synopsis: undefined,
            duration: undefined,
            images: undefined,
            aired: undefined,
            filler: false,
            recap: false,
            externalIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          ep = await this.episodeRepository.save(ep);
        }
        torrent.episodeIds = [ep.id];
      } catch (e) {
        this.logger.warn('Failed to associate episode for torrent:', result.title, e);
      }
    }

    return torrent;
  }

  /**
   * Update torrent from Nyaa result
   */
  private updateTorrentFromNyaaResult(torrent: Torrent, result: NyaaTorrent): Torrent {
    return {
      ...torrent,
      seeders: result.seeders,
      leechers: result.leechers,
      downloads: result.downloads,
      lastChecked: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Extract metadata from torrent title and description
   */
  private extractMetadata(title: string): TorrentMetadata {
    const titleLower = title.toLowerCase();

    return {
      quality: this.extractQuality(title),
      codec: this.extractCodec(title),
      audioLanguages: this.extractAudioLanguages(title),
      subtitleLanguages: this.extractSubtitleLanguages(title),
      releaseType: this.extractReleaseType(title),
      releaseGroup: this.extractReleaseGroup(title),
      isDual: titleLower.includes('dual audio'),
      isMultiSub: titleLower.includes('multi') && titleLower.includes('sub'),
      isBatch: titleLower.includes('batch'),
      hasHardSubs: titleLower.includes('hardsub'),
    };
  }

  /**
   * Extract quality from title
   */
  private extractQuality(title: string): TorrentQuality {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('2160p') || titleLower.includes('4k')) return TorrentQuality.UHD_4K;
    if (titleLower.includes('1080p')) return TorrentQuality.FULL_HD_1080p;
    if (titleLower.includes('720p')) return TorrentQuality.HD_720p;
    if (titleLower.includes('480p')) return TorrentQuality.SD_480p;
    if (titleLower.includes('raw')) return TorrentQuality.RAW;

    return TorrentQuality.UNKNOWN;
  }

  /**
   * Extract codec from title
   */
  private extractCodec(title: string): TorrentCodec {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('hevc') || titleLower.includes('h.265')) return TorrentCodec.HEVC;
    if (titleLower.includes('h.264') || titleLower.includes('x264')) return TorrentCodec.H264;
    if (titleLower.includes('av1')) return TorrentCodec.AV1;
    if (titleLower.includes('vp9')) return TorrentCodec.VP9;
    if (titleLower.includes('xvid')) return TorrentCodec.XVID;

    return TorrentCodec.UNKNOWN;
  }

  /**
   * Extract audio languages from title
   */
  private extractAudioLanguages(title: string): TorrentLanguage[] {
    const languages: TorrentLanguage[] = [];
    const titleLower = title.toLowerCase();

    if (titleLower.includes('dual audio') || titleLower.includes('multi audio')) {
      languages.push(TorrentLanguage.JAPANESE, TorrentLanguage.ENGLISH);
    } else {
      if (
        titleLower.includes('japanese') ||
        titleLower.includes('jpn') ||
        titleLower.includes('jap')
      ) {
        languages.push(TorrentLanguage.JAPANESE);
      }
      if (
        titleLower.includes('english') ||
        titleLower.includes('eng') ||
        titleLower.includes('dub')
      ) {
        languages.push(TorrentLanguage.ENGLISH);
      }
    }

    return languages.length > 0 ? languages : [TorrentLanguage.JAPANESE];
  }

  /**
   * Extract subtitle languages from title
   */
  private extractSubtitleLanguages(title: string): TorrentLanguage[] {
    const languages: TorrentLanguage[] = [];
    const titleLower = title.toLowerCase();

    if (
      titleLower.includes('multi') &&
      (titleLower.includes('sub') || titleLower.includes('subtitle'))
    ) {
      return [TorrentLanguage.MULTI];
    }

    const langMap: Record<string, TorrentLanguage> = {
      'eng|english': TorrentLanguage.ENGLISH,
      'pt-br|portuguese': TorrentLanguage.PORTUGUESE_BR,
      'esp|spanish': TorrentLanguage.SPANISH,
      'fre|french': TorrentLanguage.FRENCH,
      'ger|german': TorrentLanguage.GERMAN,
      'ita|italian': TorrentLanguage.ITALIAN,
      'rus|russian': TorrentLanguage.RUSSIAN,
      'chi|chinese': TorrentLanguage.CHINESE,
      'kor|korean': TorrentLanguage.KOREAN,
    };

    Object.entries(langMap).forEach(([pattern, lang]) => {
      const patterns = pattern.split('|');
      if (patterns.some((p) => titleLower.includes(p))) {
        languages.push(lang);
      }
    });

    return languages.length > 0 ? languages : [TorrentLanguage.ENGLISH];
  }

  /**
   * Extract release type from title
   */
  private extractReleaseType(title: string): TorrentReleaseType {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('batch') || titleLower.includes('complete'))
      return TorrentReleaseType.BATCH;
    if (titleLower.includes('season')) return TorrentReleaseType.SEASON;
    if (titleLower.includes('movie')) return TorrentReleaseType.MOVIE;
    if (titleLower.includes('ova')) return TorrentReleaseType.OVA;
    if (titleLower.includes('special')) return TorrentReleaseType.SPECIAL;

    return TorrentReleaseType.EPISODE;
  }

  /**
   * Extract release group from title
   */
  private extractReleaseGroup(title: string): string | undefined {
    // Release group usually in brackets at the end: [GroupName]
    const match = title.match(/\[([^\]]+)\]$/);
    return match ? match[1] : undefined;
  }

  /**
   * Extract episode number from title
   */
  private extractEpisodeNumber(title: string): number | undefined {
    // Match patterns like "E01", "- 01", "Episode 01", etc.
    const patterns = [
      /[Ee](\d{2,3})/,
      /[Ee]pisode\s*(\d{1,3})/i,
      /\s-\s(\d{2,3})\s/,
      /\s(\d{2,3})\s*\[/,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return undefined;
  }

  /**
   * Extract episode range for batch torrents
   */
  private extractEpisodeRange(title: string): EpisodeRange | undefined {
    // Match patterns like "01-12", "E01-E12", etc.
    const patterns = [/(\d{2,3})\s*-\s*(\d{2,3})/, /[Ee](\d{2,3})\s*-\s*[Ee]?(\d{2,3})/];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return {
          start: parseInt(match[1], 10),
          end: parseInt(match[2], 10),
        };
      }
    }

    return undefined;
  }

  /**
   * Extract info hash from magnet link
   */
  private extractInfoHash(magnetLink: string): string {
    const match = magnetLink.match(/btih:([a-fA-F0-9]{40})/i);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Parse size string to bytes
   */
  private parseSizeToBytes(sizeStr: string): number {
    const units: Record<string, number> = {
      B: 1,
      KB: 1024,
      MB: 1024 ** 2,
      GB: 1024 ** 3,
      TB: 1024 ** 4,
      KiB: 1024,
      MiB: 1024 ** 2,
      GiB: 1024 ** 3,
      TiB: 1024 ** 4,
    };

    const match = sizeStr.match(/^([\d.]+)\s*([A-Za-z]+)$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2];

    return Math.round(value * (units[unit] ?? 1));
  }

  /**
   * Check if torrent is valid based on options
   */
  private isValidTorrent(torrent: Torrent): boolean {
    if (torrent.seeders < this.options.minSeeders) return false;
    if (this.options.trustedOnly && !torrent.trusted) return false;
    return true;
  }

  /**
   * Remove duplicate torrents by info hash
   */
  private deduplicateTorrents(torrents: Torrent[]): Torrent[] {
    // Deduplicate by infoHash or normalized title, keeping the torrent with highest seeders
    const map = new Map<string, Torrent>();

    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

    for (const t of torrents) {
      const key = t.infoHash || normalize(t.title);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, t);
      } else {
        // prefer higher seeders, then newer
        if (t.seeders > existing.seeders) {
          map.set(key, t);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.seeders - a.seeders);
  }
  /**
   * Check if Nyaa service is enabled and available
   */
  get isNyaaEnabled(): boolean {
    return !!this.nyaa;
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate:
        this.metrics.totalSearches > 0
          ? (this.metrics.cacheHits / this.metrics.totalSearches) * 100
          : 0,
    };
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    if (this.searchCache) {
      this.searchCache.clear();
      this.logger.info('Search cache cleared');
    }
  }

  /**
   * Refresh all torrents for an anime
   * Updates seeders, leechers, and other dynamic data
   */
  async refreshAllTorrents(animeId: string): Promise<number> {
    const torrents = await this.torrentRepository.findByAnimeId(animeId);
    
    if (torrents.length === 0) {
      this.logger.warn(`No torrents found for anime: ${animeId}`);
      return 0;
    }

    this.logger.info(`Refreshing ${torrents.length} torrents for anime: ${animeId}`);
    let refreshed = 0;

    for (const torrent of torrents) {
      try {
        await this.refreshTorrent(torrent.id);
        refreshed++;
      } catch (error) {
        this.logger.warn(`Failed to refresh torrent ${torrent.id}:`, error);
      }
    }

    this.logger.info(`Refreshed ${refreshed}/${torrents.length} torrents`);
    return refreshed;
  }

  /**
   * Get torrents by quality for an anime
   */
  async getTorrentsByQuality(
    animeId: string,
    quality: TorrentQuality,
  ): Promise<Torrent[]> {
    return this.torrentRepository.findByFilters({
      animeId,
      quality,
    });
  }

  /**
   * Get best quality available for episode
   */
  async getBestQualityForEpisode(
    animeId: string,
    episodeNumber: number,
  ): Promise<TorrentQuality | null> {
    const torrents = await this.torrentRepository.findByFilters({
      animeId,
      episodeNumber,
    });

    if (torrents.length === 0) return null;

    // Quality priority: 4K > 1080p > 720p > 480p
    const qualityPriority = [
      TorrentQuality.UHD_4K,
      TorrentQuality.FULL_HD_1080p,
      TorrentQuality.HD_720p,
      TorrentQuality.SD_480p,
    ];

    for (const quality of qualityPriority) {
      if (torrents.some((t) => t.metadata.quality === quality)) {
        return quality;
      }
    }

    return torrents[0].metadata.quality;
  }
}
