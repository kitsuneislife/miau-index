import { Torrent, TorrentSearchFilter } from '../models/Torrent';

/**
 * Repository interface for Torrent persistence
 */
export interface ITorrentRepository {
  /**
   * Find torrent by ID
   */
  findById(id: string): Promise<Torrent | null>;

  /**
   * Find torrents by anime ID
   */
  findByAnimeId(animeId: string): Promise<Torrent[]>;

  /**
   * Find torrents by episode ID
   */
  findByEpisodeId(episodeId: string): Promise<Torrent[]>;

  /**
   * Find torrents with filters
   */
  findByFilters(filters: TorrentSearchFilter): Promise<Torrent[]>;

  /**
   * Save or update torrent
   */
  save(torrent: Torrent): Promise<Torrent>;

  /**
   * Save multiple torrents
   */
  saveMany(torrents: Torrent[]): Promise<Torrent[]>;

  /**
   * Delete torrent by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Delete torrents by anime ID
   */
  deleteByAnimeId(animeId: string): Promise<number>;

  /**
   * Get all torrents
   */
  findAll(): Promise<Torrent[]>;

  /**
   * Count torrents
   */
  count(): Promise<number>;
}

/**
 * In-memory implementation of Torrent Repository
 */
export class InMemoryTorrentRepository implements ITorrentRepository {
  private torrents: Map<string, Torrent> = new Map();

  async findById(id: string): Promise<Torrent | null> {
    return this.torrents.get(id) ?? null;
  }

  async findByAnimeId(animeId: string): Promise<Torrent[]> {
    return Array.from(this.torrents.values()).filter((torrent) => torrent.animeId === animeId);
  }

  async findByEpisodeId(episodeId: string): Promise<Torrent[]> {
    return Array.from(this.torrents.values()).filter((torrent) =>
      torrent.episodeIds?.includes(episodeId)
    );
  }

  async findByFilters(filters: TorrentSearchFilter): Promise<Torrent[]> {
    let results = Array.from(this.torrents.values());

    if (filters.animeId) {
      results = results.filter((t) => t.animeId === filters.animeId);
    }

    if (filters.episodeId) {
      results = results.filter((t) => t.episodeIds?.includes(filters.episodeId!));
    }

    if (filters.seasonId) {
      results = results.filter((t) => t.seasonId === filters.seasonId);
    }

    if (filters.episodeNumber !== undefined) {
      results = results.filter(
        (t) =>
          t.episodeNumber === filters.episodeNumber ||
          (t.episodeRange &&
            t.episodeRange.start <= filters.episodeNumber! &&
            t.episodeRange.end >= filters.episodeNumber!)
      );
    }

    if (filters.quality) {
      results = results.filter((t) => t.metadata.quality === filters.quality);
    }

    if (filters.audioLanguage) {
      results = results.filter((t) => t.metadata.audioLanguages.includes(filters.audioLanguage!));
    }

    if (filters.subtitleLanguage) {
      results = results.filter((t) =>
        t.metadata.subtitleLanguages.includes(filters.subtitleLanguage!)
      );
    }

    if (filters.releaseType) {
      results = results.filter((t) => t.metadata.releaseType === filters.releaseType);
    }

    if (filters.minSeeders !== undefined) {
      results = results.filter((t) => t.seeders >= filters.minSeeders!);
    }

    if (filters.trustedOnly) {
      results = results.filter((t) => t.trusted === true);
    }

    // Sort by seeders descending
    return results.sort((a, b) => b.seeders - a.seeders);
  }

  async save(torrent: Torrent): Promise<Torrent> {
    const now = new Date();
    const savedTorrent = {
      ...torrent,
      updatedAt: now,
      createdAt: torrent.createdAt ?? now,
    };
    this.torrents.set(torrent.id, savedTorrent);
    return savedTorrent;
  }

  async saveMany(torrents: Torrent[]): Promise<Torrent[]> {
    return Promise.all(torrents.map((t) => this.save(t)));
  }

  async delete(id: string): Promise<boolean> {
    return this.torrents.delete(id);
  }

  async deleteByAnimeId(animeId: string): Promise<number> {
    const toDelete = Array.from(this.torrents.values()).filter((t) => t.animeId === animeId);
    toDelete.forEach((t) => this.torrents.delete(t.id));
    return toDelete.length;
  }

  async findAll(): Promise<Torrent[]> {
    return Array.from(this.torrents.values());
  }

  async count(): Promise<number> {
    return this.torrents.size;
  }
}
