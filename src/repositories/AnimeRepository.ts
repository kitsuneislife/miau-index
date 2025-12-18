import { Anime } from '../models/Anime';

/**
 * Repository interface for anime data persistence
 */
export interface IAnimeRepository {
  /**
   * Find an anime by its internal ID
   */
  findById(id: string): Promise<Anime | null>;

  /**
   * Find anime by external ID
   */
  findByExternalId(source: string, externalId: string): Promise<Anime | null>;

  /**
   * Search anime by title
   */
  searchByTitle(title: string, limit?: number): Promise<Anime[]>;

  /**
   * Save or update anime data
   */
  save(anime: Anime): Promise<Anime>;

  /**
   * Save multiple anime
   */
  saveMany(animes: Anime[]): Promise<Anime[]>;

  /**
   * Delete anime by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Get all anime (with pagination)
   */
  findAll(page: number, limit: number): Promise<Anime[]>;

  /**
   * Count total anime
   */
  count(): Promise<number>;
}

/**
 * In-memory implementation of anime repository (for development/testing)
 */
export class InMemoryAnimeRepository implements IAnimeRepository {
  private animes: Map<string, Anime> = new Map();

  async findById(id: string): Promise<Anime | null> {
    return this.animes.get(id) || null;
  }

  async findByExternalId(source: string, externalId: string): Promise<Anime | null> {
    for (const anime of this.animes.values()) {
      const match = anime.externalIds.find((ext) => ext.source === source && ext.id === externalId);
      if (match) {
        return anime;
      }
    }
    return null;
  }

  async searchByTitle(title: string, limit = 10): Promise<Anime[]> {
    const searchTerm = title.toLowerCase();
    const results: Anime[] = [];

    for (const anime of this.animes.values()) {
      if (
        anime.title.romaji?.toLowerCase().includes(searchTerm) ||
        anime.title.english?.toLowerCase().includes(searchTerm) ||
        anime.title.native?.toLowerCase().includes(searchTerm) ||
        anime.title.synonyms?.some((s: string) => s.toLowerCase().includes(searchTerm))
      ) {
        results.push(anime);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  async save(anime: Anime): Promise<Anime> {
    anime.updatedAt = new Date();
    this.animes.set(anime.id, anime);
    return anime;
  }

  async saveMany(animes: Anime[]): Promise<Anime[]> {
    const saved: Anime[] = [];
    for (const anime of animes) {
      saved.push(await this.save(anime));
    }
    return saved;
  }

  async delete(id: string): Promise<boolean> {
    return this.animes.delete(id);
  }

  async findAll(page: number, limit: number): Promise<Anime[]> {
    const start = page * limit;
    const allAnimes = Array.from(this.animes.values());
    return allAnimes.slice(start, start + limit);
  }

  async count(): Promise<number> {
    return this.animes.size;
  }
}
