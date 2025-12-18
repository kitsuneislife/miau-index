import { Anime } from '../models/Anime';
import { IAnimeProvider } from '../providers/BaseProvider';
import { IAnimeRepository } from '../repositories/AnimeRepository';
import { DataSource } from '../types/common';

/**
 * Options for anime unification
 */
export interface UnificationOptions {
  /**
   * Preferred sources in order of priority
   */
  preferredSources?: DataSource[];

  /**
   * Minimum number of sources required for a field to be considered
   */
  minSourcesForConsensus?: number;

  /**
   * Whether to merge arrays (genres, themes, etc.)
   */
  mergeArrays?: boolean;
}

/**
 * Service responsible for unifying anime data from multiple sources
 */
export class AnimeUnificationService {
  private providers: Map<DataSource, IAnimeProvider> = new Map();
  private repository: IAnimeRepository;

  constructor(repository: IAnimeRepository) {
    this.repository = repository;
  }

  /**
   * Register a data provider
   */
  registerProvider(provider: IAnimeProvider): void {
    this.providers.set(provider.getSource(), provider);
  }

  /**
   * Fetch and unify anime data from all available sources
   */
  async fetchAndUnify(
    externalIds: Array<{ source: DataSource; id: string }>,
    options: UnificationOptions = {}
  ): Promise<Anime> {
    const animeDataFromSources: Anime[] = [];

    // Fetch from all sources
    for (const { source, id } of externalIds) {
      const provider = this.providers.get(source);
      if (provider) {
        try {
          const anime = await provider.fetchAnimeById(id);
          if (anime) {
            animeDataFromSources.push(anime);
          }
        } catch (error) {
          console.error(`Failed to fetch from ${source}:`, error);
        }
      }
    }

    if (animeDataFromSources.length === 0) {
      throw new Error('No anime data could be fetched from any source');
    }

    // Unify the data
    const unified = this.unifyAnimeData(animeDataFromSources, options);

    // Save to repository
    return await this.repository.save(unified);
  }

  /**
   * Unify anime data from multiple sources using consensus and priority
   */
  private unifyAnimeData(sources: Anime[], options: UnificationOptions): Anime {
    const { preferredSources = [], mergeArrays = true } = options;

    // Start with the first source as base
    const base = sources[0];
    const unified: Anime = { ...base };

    // Unify titles
    unified.title = {
      romaji: this.selectBestValue(
        sources.map((s) => s.title.romaji),
        preferredSources
      ),
      english: this.selectBestValue(
        sources.map((s) => s.title.english),
        preferredSources
      ),
      native: this.selectBestValue(
        sources.map((s) => s.title.native),
        preferredSources
      ),
      synonyms: mergeArrays
        ? this.mergeArrayFields(sources.map((s) => s.title.synonyms || []))
        : base.title.synonyms,
    };

    // Unify synopsis (prefer longest non-empty)
    const synopses = sources.map((s) => s.synopsis).filter((s): s is string => !!s);
    unified.synopsis = synopses.sort((a, b) => b.length - a.length)[0] || base.synopsis;

    // Unify ratings
    unified.ratings = sources.flatMap((s) => s.ratings);

    // Merge array fields
    if (mergeArrays) {
      unified.genres = this.mergeArrayFields(sources.map((s) => s.genres));
      unified.themes = this.mergeArrayFields(sources.map((s) => s.themes));
      unified.studios = this.mergeArrayFields(sources.map((s) => s.studios));
      unified.producers = this.mergeArrayFields(sources.map((s) => s.producers));
    }

    // Combine all external IDs
    unified.externalIds = sources.flatMap((s) => s.externalIds);

    // Update metadata
    unified.lastSyncedAt = new Date();
    unified.updatedAt = new Date();

    return unified;
  }

  /**
   * Select the best value from multiple sources based on priority
   */
  private selectBestValue<T>(
    values: (T | undefined)[],
    _preferredSources: DataSource[]
  ): T | undefined {
    // Filter out undefined values
    const defined = values.filter((v): v is T => v !== undefined);

    if (defined.length === 0) return undefined;
    if (defined.length === 1) return defined[0];

    // If we have preferred sources logic, implement it here
    // For now, return the first non-undefined value
    return defined[0];
  }

  /**
   * Merge array fields removing duplicates
   */
  private mergeArrayFields(arrays: string[][]): string[] {
    const merged = new Set<string>();
    for (const arr of arrays) {
      for (const item of arr) {
        if (item) merged.add(item);
      }
    }
    return Array.from(merged).sort();
  }

  /**
   * Search for anime across all providers and unify results
   */
  async searchAndUnify(query: string, limit: number = 10): Promise<Anime[]> {
    const resultsMap = new Map<string, Anime[]>();

    // Search across all providers
    for (const [source, provider] of this.providers) {
      try {
        const results = await provider.searchAnime(query, limit);
        for (const anime of results) {
          // Group by title for potential unification
          const key = anime.title.romaji || anime.title.english || anime.id;
          if (!resultsMap.has(key)) {
            resultsMap.set(key, []);
          }
          resultsMap.get(key)?.push(anime);
        }
      } catch (error) {
        console.error(`Search failed for ${source}:`, error);
      }
    }

    // Unify grouped results
    const unified: Anime[] = [];
    for (const animeGroup of resultsMap.values()) {
      if (animeGroup.length > 0) {
        const unifiedAnime = this.unifyAnimeData(animeGroup, { mergeArrays: true });
        unified.push(unifiedAnime);
      }
    }

    return unified.slice(0, limit);
  }
}
