import { Episode, AnimeSeason } from '../models/Episode';

/**
 * Repository interface for episode data persistence
 */
export interface IEpisodeRepository {
  findById(id: string): Promise<Episode | null>;
  findByAnimeId(animeId: string): Promise<Episode[]>;
  findByNumber(animeId: string, number: number): Promise<Episode | null>;
  save(episode: Episode): Promise<Episode>;
  saveMany(episodes: Episode[]): Promise<Episode[]>;
  delete(id: string): Promise<boolean>;
  count(animeId?: string): Promise<number>;
}

/**
 * In-memory implementation of episode repository
 */
export class InMemoryEpisodeRepository implements IEpisodeRepository {
  private episodes: Map<string, Episode> = new Map();

  async findById(id: string): Promise<Episode | null> {
    return this.episodes.get(id) || null;
  }

  async findByAnimeId(animeId: string): Promise<Episode[]> {
    const episodes: Episode[] = [];
    for (const episode of this.episodes.values()) {
      if (episode.animeId === animeId) {
        episodes.push(episode);
      }
    }
    return episodes.sort((a, b) => a.number - b.number);
  }

  async findByNumber(animeId: string, number: number): Promise<Episode | null> {
    for (const episode of this.episodes.values()) {
      if (episode.animeId === animeId && episode.number === number) {
        return episode;
      }
    }
    return null;
  }

  async save(episode: Episode): Promise<Episode> {
    episode.updatedAt = new Date();
    this.episodes.set(episode.id, episode);
    return episode;
  }

  async saveMany(episodes: Episode[]): Promise<Episode[]> {
    const saved: Episode[] = [];
    for (const episode of episodes) {
      saved.push(await this.save(episode));
    }
    return saved;
  }

  async delete(id: string): Promise<boolean> {
    return this.episodes.delete(id);
  }

  async count(animeId?: string): Promise<number> {
    if (!animeId) {
      return this.episodes.size;
    }

    let count = 0;
    for (const episode of this.episodes.values()) {
      if (episode.animeId === animeId) {
        count++;
      }
    }
    return count;
  }
}

/**
 * Repository interface for anime season data persistence
 */
export interface ISeasonRepository {
  findById(id: string): Promise<AnimeSeason | null>;
  findByAnimeId(animeId: string): Promise<AnimeSeason[]>;
  findBySeasonNumber(animeId: string, seasonNumber: number): Promise<AnimeSeason | null>;
  save(season: AnimeSeason): Promise<AnimeSeason>;
  saveMany(seasons: AnimeSeason[]): Promise<AnimeSeason[]>;
  delete(id: string): Promise<boolean>;
  count(animeId?: string): Promise<number>;
}

/**
 * In-memory implementation of season repository
 */
export class InMemorySeasonRepository implements ISeasonRepository {
  private seasons: Map<string, AnimeSeason> = new Map();

  async findById(id: string): Promise<AnimeSeason | null> {
    return this.seasons.get(id) || null;
  }

  async findByAnimeId(animeId: string): Promise<AnimeSeason[]> {
    const seasons: AnimeSeason[] = [];
    for (const season of this.seasons.values()) {
      if (season.animeId === animeId) {
        seasons.push(season);
      }
    }
    return seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
  }

  async findBySeasonNumber(animeId: string, seasonNumber: number): Promise<AnimeSeason | null> {
    for (const season of this.seasons.values()) {
      if (season.animeId === animeId && season.seasonNumber === seasonNumber) {
        return season;
      }
    }
    return null;
  }

  async save(season: AnimeSeason): Promise<AnimeSeason> {
    season.updatedAt = new Date();
    this.seasons.set(season.id, season);
    return season;
  }

  async saveMany(seasons: AnimeSeason[]): Promise<AnimeSeason[]> {
    const saved: AnimeSeason[] = [];
    for (const season of seasons) {
      saved.push(await this.save(season));
    }
    return saved;
  }

  async delete(id: string): Promise<boolean> {
    return this.seasons.delete(id);
  }

  async count(animeId?: string): Promise<number> {
    if (!animeId) {
      return this.seasons.size;
    }

    let count = 0;
    for (const season of this.seasons.values()) {
      if (season.animeId === animeId) {
        count++;
      }
    }
    return count;
  }
}
