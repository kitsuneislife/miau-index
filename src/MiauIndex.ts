import { Anime } from './models/Anime';
import { DataSource } from './types/common';
import { MyAnimeListProvider, AniListProvider, KitsuProvider } from './providers';
import { AnimeUnificationService, UnificationOptions } from './services/AnimeUnificationService';
import { InMemoryAnimeRepository } from './repositories/AnimeRepository';
import { Logger } from './utils/logger';
import { NyaaService, NyaaServiceOptions } from './services/NyaaService';
import { InMemoryTorrentRepository } from './repositories/TorrentRepository';
import { Torrent, TorrentSearchFilter, TorrentStats } from './models/Torrent';

/**
 * Configuration options for MiauIndex
 */
export interface MiauIndexConfig {
  /**
   * MyAnimeList API key (Client ID) - OPTIONAL
   * If not provided, only open sources (AniList, Kitsu) will be used
   */
  malApiKey?: string;

  /**
   * Enable/disable specific providers
   */
  enabledProviders?: {
    myAnimeList?: boolean;
    aniList?: boolean;
    kitsu?: boolean;
  };

  /**
   * Prefer open sources (AniList, Kitsu) over sources requiring API keys
   * Default: true
   */
  preferOpenSources?: boolean;

  /**
   * Unification options
   */
  unificationOptions?: UnificationOptions;

  /**
   * Enable logging
   */
  enableLogging?: boolean;

  /**
   * OPTIONAL: Enable Nyaa torrent indexing extension
   * Requires @kitsuneislife/nyaa package to be installed
   */
  enableNyaa?: boolean;

  /**
   * OPTIONAL: Nyaa service configuration
   */
  nyaaOptions?: NyaaServiceOptions;
}

/**
 * Main class for the Miau-Index anime indexer
 * Provides a unified interface to fetch and search anime from multiple sources
 */
export class MiauIndex {
  private unificationService: AnimeUnificationService;
  private repository: InMemoryAnimeRepository;
  private providers: Map<DataSource, any> = new Map();
  private logger: Logger;
  private config: MiauIndexConfig;

  // OPTIONAL: Nyaa torrent indexing extension
  private nyaaService?: NyaaService;
  private torrentRepository?: InMemoryTorrentRepository;

  constructor(config: MiauIndexConfig = {}) {
    this.config = config;
    this.logger = new Logger('MiauIndex');
    this.repository = new InMemoryAnimeRepository();
    this.unificationService = new AnimeUnificationService(this.repository);

    // Initialize providers based on configuration
    this.initializeProviders();

    // OPTIONAL: Initialize Nyaa extension
    if (config.enableNyaa) {
      this.initializeNyaaExtension();
    }

    if (config.enableLogging) {
      this.logger.info('MiauIndex initialized with providers:', Array.from(this.providers.keys()));
      if (this.nyaaService) {
        this.logger.info('🌸 Nyaa torrent extension enabled');
      }
    }
  }

  /**
   * Initialize data providers based on configuration
   * Open sources (AniList, Kitsu) are prioritized and initialized first
   */
  private initializeProviders(): void {
    const { enabledProviders = {}, malApiKey, preferOpenSources = true } = this.config;
    const preferredSources: DataSource[] = [];

    // PRIORITY 1: AniList provider (no API key required - OPEN SOURCE)
    if (enabledProviders.aniList !== false) {
      const aniListProvider = new AniListProvider();
      this.providers.set(DataSource.ANILIST, aniListProvider);
      this.unificationService.registerProvider(aniListProvider);
      if (preferOpenSources) {
        preferredSources.push(DataSource.ANILIST);
      }
      if (this.config.enableLogging) {
        this.logger.info('✓ AniList provider initialized (open source, no API key required)');
      }
    }

    // PRIORITY 2: Kitsu provider (no API key required - OPEN SOURCE)
    if (enabledProviders.kitsu !== false) {
      const kitsuProvider = new KitsuProvider();
      this.providers.set(DataSource.KITSU, kitsuProvider);
      this.unificationService.registerProvider(kitsuProvider);
      if (preferOpenSources) {
        preferredSources.push(DataSource.KITSU);
      }
      if (this.config.enableLogging) {
        this.logger.info('✓ Kitsu provider initialized (open source, no API key required)');
      }
    }

    // PRIORITY 3: MyAnimeList provider (requires API key - OPTIONAL)
    if (enabledProviders.myAnimeList !== false && malApiKey) {
      const malProvider = new MyAnimeListProvider(malApiKey);
      this.providers.set(DataSource.MYANIMELIST, malProvider);
      this.unificationService.registerProvider(malProvider);
      if (!preferOpenSources) {
        preferredSources.push(DataSource.MYANIMELIST);
      }
      if (this.config.enableLogging) {
        this.logger.info('✓ MyAnimeList provider initialized (requires API key)');
      }
    } else if (enabledProviders.myAnimeList !== false && !malApiKey) {
      if (this.config.enableLogging) {
        this.logger.warn(
          '⚠ MyAnimeList provider skipped (no API key provided - using open sources only)'
        );
      }
    }

    // Set preferred sources for unification
    if (preferredSources.length > 0) {
      this.config.unificationOptions = {
        ...this.config.unificationOptions,
        preferredSources,
      };
    }
  }

  /**
   * Fetch and unify anime data from multiple sources
   *
   * @example
   * ```typescript
   * const anime = await miauIndex.fetchAnime([
   *   { source: DataSource.MYANIMELIST, id: '5114' },
   *   { source: DataSource.ANILIST, id: '5114' }
   * ]);
   * ```
   */
  async fetchAnime(
    externalIds: Array<{ source: DataSource; id: string }>,
    options?: UnificationOptions
  ): Promise<Anime> {
    this.logger.info(`Fetching anime from ${externalIds.length} sources...`);

    const mergedOptions = { ...this.config.unificationOptions, ...options };
    const anime = await this.unificationService.fetchAndUnify(externalIds, mergedOptions);

    this.logger.info(
      `Successfully fetched and unified anime: ${anime.title.romaji || anime.title.english}`
    );

    return anime;
  }

  /**
   * Search for anime across all enabled providers
   *
   * @example
   * ```typescript
   * const results = await miauIndex.searchAnime('Cowboy Bebop', 10);
   * ```
   */
  async searchAnime(query: string, limit: number = 10): Promise<Anime[]> {
    this.logger.info(`Searching for anime: "${query}" (limit: ${limit})`);

    const searchPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        return await provider.searchAnime(query, limit);
      } catch (error) {
        this.logger.error(`Search failed for provider ${provider.getSource()}:`, error);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);
    const allResults = results.flat();

    // Deduplicate based on titles
    const uniqueResults = this.deduplicateAnime(allResults);

    this.logger.info(`Found ${uniqueResults.length} unique results`);

    return uniqueResults.slice(0, limit);
  }

  /**
   * Get seasonal anime from all providers
   *
   * @example
   * ```typescript
   * const winterAnime = await miauIndex.getSeasonalAnime(2024, 'winter');
   * ```
   */
  async getSeasonalAnime(year: number, season: string): Promise<Anime[]> {
    this.logger.info(`Fetching seasonal anime: ${season} ${year}`);

    const seasonPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        return await provider.getSeasonalAnime(year, season);
      } catch (error) {
        this.logger.error(`Seasonal fetch failed for provider ${provider.getSource()}:`, error);
        return [];
      }
    });

    const results = await Promise.all(seasonPromises);
    const allResults = results.flat();

    // Deduplicate results
    const uniqueResults = this.deduplicateAnime(allResults);

    this.logger.info(`Found ${uniqueResults.length} unique seasonal anime`);

    return uniqueResults;
  }

  /**
   * Search in the local repository
   *
   * @example
   * ```typescript
   * const localResults = await miauIndex.searchLocal('Naruto', 5);
   * ```
   */
  async searchLocal(query: string, limit: number = 10): Promise<Anime[]> {
    this.logger.info(`Searching local repository: "${query}"`);

    const results = await this.repository.searchByTitle(query, limit);

    this.logger.info(`Found ${results.length} local results`);

    return results;
  }

  /**
   * Get anime by ID from local repository
   */
  async getById(id: string): Promise<Anime | null> {
    return await this.repository.findById(id);
  }

  /**
   * Save anime to local repository
   */
  async saveAnime(anime: Anime): Promise<Anime> {
    return await this.repository.save(anime);
  }

  /**
   * Get all anime from local repository
   */
  async getAllLocal(): Promise<Anime[]> {
    return await this.repository.findAll(1, 1000);
  }

  /**
   * Clear local repository
   */
  async clearLocal(): Promise<void> {
    const allAnime = await this.repository.findAll(1, 10000);
    for (const anime of allAnime) {
      await this.repository.delete(anime.id);
    }
    this.logger.info('Local repository cleared');
  }

  /**
   * Check health of all providers
   */
  async checkProviders(): Promise<Record<DataSource, boolean>> {
    this.logger.info('Checking provider health...');

    const healthChecks: Record<DataSource, boolean> = {} as any;

    for (const [source, provider] of this.providers.entries()) {
      try {
        healthChecks[source] = await provider.isAvailable();
      } catch {
        healthChecks[source] = false;
      }
    }

    this.logger.info('Provider health check complete:', healthChecks);

    return healthChecks;
  }

  /**
   * Get statistics about the local repository
   */
  async getStats(): Promise<{
    totalAnime: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    sources: Record<DataSource, number>;
  }> {
    const allAnime = await this.repository.findAll(1, 10000);

    const stats = {
      totalAnime: allAnime.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      sources: {} as Record<DataSource, number>,
    };

    for (const anime of allAnime) {
      // Count by type
      stats.byType[anime.type] = (stats.byType[anime.type] || 0) + 1;

      // Count by status
      stats.byStatus[anime.status] = (stats.byStatus[anime.status] || 0) + 1;

      // Count by sources
      for (const externalId of anime.externalIds) {
        stats.sources[externalId.source] = (stats.sources[externalId.source] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * OPTIONAL: Initialize Nyaa torrent extension
   * Requires @kitsuneislife/nyaa package to be installed
   */
  private initializeNyaaExtension(): void {
    try {
      this.torrentRepository = new InMemoryTorrentRepository();
      this.nyaaService = new NyaaService(this.torrentRepository, this.config.nyaaOptions);

      if (this.config.enableLogging) {
        this.logger.info('🌸 Nyaa torrent extension initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Nyaa extension:', error);
      this.logger.warn(
        '⚠ Make sure @kitsuneislife/nyaa package is installed: npm install @kitsuneislife/nyaa'
      );
    }
  }

  /**
   * OPTIONAL: Index torrents for an anime
   * Requires Nyaa extension to be enabled
   */
  async indexTorrents(anime: Anime): Promise<Torrent[]> {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.indexAnime(anime);
  }

  /**
   * OPTIONAL: Index torrents for specific episode
   * Requires Nyaa extension to be enabled
   */
  async indexEpisodeTorrents(anime: Anime, episodeNumber: number): Promise<Torrent[]> {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.indexEpisode(anime, episodeNumber);
  }

  /**
   * OPTIONAL: Search torrents for an anime
   * Requires Nyaa extension to be enabled
   */
  async searchTorrents(anime: Anime, filters?: TorrentSearchFilter): Promise<Torrent[]> {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.searchTorrents(anime, filters);
  }

  /**
   * OPTIONAL: Get best torrent for episode
   * Requires Nyaa extension to be enabled
   */
  async getBestTorrent(anime: Anime, episodeNumber: number): Promise<Torrent | null> {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.getBestTorrentForEpisode(anime, episodeNumber);
  }

  /**
   * OPTIONAL: Get torrent statistics for anime
   * Requires Nyaa extension to be enabled
   */
  async getTorrentStats(animeId: string): Promise<TorrentStats> {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.getTorrentStats(animeId);
  }

  /**
   * OPTIONAL: Refresh torrent information (seeders, leechers)
   * Requires Nyaa extension to be enabled
   */
  async refreshTorrent(torrentId: string): Promise<Torrent | null> {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.refreshTorrent(torrentId);
  }

  /**
   * OPTIONAL: Check if Nyaa extension is enabled
   */
  get isNyaaEnabled(): boolean {
    return !!this.nyaaService;
  }

  /**
   * OPTIONAL: Get Nyaa service metrics
   * Requires Nyaa extension to be enabled
   */
  getNyaaMetrics() {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.getMetrics();
  }

  /**
   * OPTIONAL: Clear Nyaa search cache
   * Requires Nyaa extension to be enabled
   */
  clearNyaaCache(): void {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    this.nyaaService.clearCache();
  }

  /**
   * OPTIONAL: Refresh all torrents for an anime
   * Requires Nyaa extension to be enabled
   */
  async refreshAllTorrents(animeId: string): Promise<number> {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.refreshAllTorrents(animeId);
  }

  /**
   * OPTIONAL: Get torrents by quality
   * Requires Nyaa extension to be enabled
   */
  async getTorrentsByQuality(
    animeId: string,
    quality: any,
  ): Promise<Torrent[]> {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.getTorrentsByQuality(animeId, quality);
  }

  /**
   * OPTIONAL: Get best quality available for episode
   * Requires Nyaa extension to be enabled
   */
  async getBestQualityForEpisode(
    animeId: string,
    episodeNumber: number,
  ): Promise<any | null> {
    if (!this.nyaaService) {
      throw new Error('Nyaa extension is not enabled. Set enableNyaa: true in config.');
    }

    return this.nyaaService.getBestQualityForEpisode(animeId, episodeNumber);
  }

  /**
   * Deduplicate anime based on titles
   */
  private deduplicateAnime(anime: Anime[]): Anime[] {
    const seen = new Map<string, Anime>();

    for (const item of anime) {
      const key =
        item.title.romaji?.toLowerCase() ||
        item.title.english?.toLowerCase() ||
        item.title.native?.toLowerCase() ||
        item.id;

      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }

    return Array.from(seen.values());
  }
}
