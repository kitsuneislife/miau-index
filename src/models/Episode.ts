import { ExternalId, Image } from '../types/common';

/**
 * Episode model representing individual anime episodes
 */
export interface Episode {
  // Internal ID
  id: string;

  // Related Anime
  animeId: string;

  // Episode Information
  number: number;
  title?: string;
  titleJapanese?: string;
  titleRomaji?: string;

  // Content
  synopsis?: string;
  duration?: number; // in minutes

  // Media
  images?: Image;

  // Air Information
  aired?: Date;
  filler?: boolean;
  recap?: boolean;

  // External References
  externalIds: ExternalId[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Season model representing anime seasons (cours)
 */
export interface AnimeSeason {
  // Internal ID
  id: string;

  // Related Anime
  animeId: string;

  // Season Information
  seasonNumber: number;
  title?: string;

  // Episodes
  episodeCount?: number;
  episodes?: Episode[];

  // Air Information
  aired?: {
    start?: Date;
    end?: Date;
  };

  // External References
  externalIds: ExternalId[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
