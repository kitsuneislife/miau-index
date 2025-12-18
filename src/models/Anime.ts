import {
  AnimeType,
  AnimeStatus,
  Season,
  AgeRating,
  ExternalId,
  DateRange,
  Image,
  Title,
  Rating,
} from '../types/common';

/**
 * Main Anime model representing unified anime data
 */
export interface Anime {
  // Internal ID
  id: string;

  // Titles
  title: Title;

  // Basic Information
  type: AnimeType;
  status: AnimeStatus;
  episodes?: number;
  duration?: number; // in minutes
  season?: Season;
  year?: number;

  // Descriptions
  synopsis?: string;
  background?: string;

  // Media
  images: Image;
  trailer?: {
    url?: string;
    embedUrl?: string;
  };

  // Dates
  aired: DateRange;
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
  };

  // Ratings & Popularity
  ratings: Rating[];
  ageRating?: AgeRating;

  // Categories
  genres: string[];
  themes: string[];
  demographics?: string[];
  studios: string[];
  producers: string[];
  licensors: string[];

  // Relations
  relations?: AnimeRelation[];
  adaptations?: Adaptation[];

  // External References
  externalIds: ExternalId[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}

export interface AnimeRelation {
  animeId: string;
  relationType: RelationType;
}

export enum RelationType {
  SEQUEL = 'SEQUEL',
  PREQUEL = 'PREQUEL',
  SIDE_STORY = 'SIDE_STORY',
  ALTERNATIVE_VERSION = 'ALTERNATIVE_VERSION',
  ALTERNATIVE_SETTING = 'ALTERNATIVE_SETTING',
  PARENT_STORY = 'PARENT_STORY',
  SUMMARY = 'SUMMARY',
  FULL_STORY = 'FULL_STORY',
  SPIN_OFF = 'SPIN_OFF',
  OTHER = 'OTHER',
}

export interface Adaptation {
  type: AdaptationType;
  title: string;
  url?: string;
}

export enum AdaptationType {
  MANGA = 'MANGA',
  LIGHT_NOVEL = 'LIGHT_NOVEL',
  NOVEL = 'NOVEL',
  VISUAL_NOVEL = 'VISUAL_NOVEL',
  GAME = 'GAME',
  OTHER = 'OTHER',
}
