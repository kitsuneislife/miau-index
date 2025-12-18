/**
 * Base types used across the application
 */

export enum AnimeType {
  TV = 'TV',
  MOVIE = 'MOVIE',
  OVA = 'OVA',
  ONA = 'ONA',
  SPECIAL = 'SPECIAL',
  MUSIC = 'MUSIC',
}

export enum AnimeStatus {
  AIRING = 'AIRING',
  FINISHED = 'FINISHED',
  NOT_YET_AIRED = 'NOT_YET_AIRED',
  CANCELLED = 'CANCELLED',
}

export enum Season {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL',
}

export enum AgeRating {
  G = 'G', // All Ages
  PG = 'PG', // Children
  PG_13 = 'PG_13', // Teens 13 or older
  R = 'R', // 17+ (violence & profanity)
  R_PLUS = 'R_PLUS', // Mild Nudity
  RX = 'RX', // Hentai
}

export enum DataSource {
  MYANIMELIST = 'MYANIMELIST',
  ANILIST = 'ANILIST',
  KITSU = 'KITSU',
  ANIDB = 'ANIDB',
  TMDB = 'TMDB',
}

export interface ExternalId {
  source: DataSource;
  id: string;
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface Image {
  small?: string;
  medium?: string;
  large?: string;
  original?: string;
}

export interface Title {
  romaji?: string;
  english?: string;
  native?: string;
  synonyms?: string[];
}

export interface Rating {
  source: DataSource;
  score?: number;
  votes?: number;
  rank?: number;
  popularity?: number;
}
