/**
 * Torrent quality types
 */
export enum TorrentQuality {
  SD_480p = '480p',
  HD_720p = '720p',
  FULL_HD_1080p = '1080p',
  UHD_2160p = '2160p',
  UHD_4K = '4K',
  RAW = 'RAW',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Audio/Subtitle language
 */
export enum TorrentLanguage {
  JAPANESE = 'ja',
  ENGLISH = 'en',
  PORTUGUESE_BR = 'pt-BR',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  ITALIAN = 'it',
  RUSSIAN = 'ru',
  CHINESE = 'zh',
  KOREAN = 'ko',
  MULTI = 'multi',
  UNKNOWN = 'unknown',
}

/**
 * Torrent codec
 */
export enum TorrentCodec {
  H264 = 'H.264',
  H265 = 'H.265',
  HEVC = 'HEVC',
  AV1 = 'AV1',
  VP9 = 'VP9',
  XVID = 'XviD',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Torrent release type
 */
export enum TorrentReleaseType {
  EPISODE = 'EPISODE',
  BATCH = 'BATCH',
  SEASON = 'SEASON',
  COMPLETE = 'COMPLETE',
  MOVIE = 'MOVIE',
  OVA = 'OVA',
  SPECIAL = 'SPECIAL',
}

/**
 * Torrent metadata extracted from title and description
 */
export interface TorrentMetadata {
  quality: TorrentQuality;
  codec: TorrentCodec;
  audioLanguages: TorrentLanguage[];
  subtitleLanguages: TorrentLanguage[];
  releaseType: TorrentReleaseType;
  releaseGroup?: string;
  isDual?: boolean; // Dual audio
  isMultiSub?: boolean; // Multiple subtitles
  isBatch?: boolean;
  hasHardSubs?: boolean;
}

/**
 * Episode range for batch torrents
 */
export interface EpisodeRange {
  start: number;
  end: number;
}

/**
 * Main Torrent model
 */
export interface Torrent {
  // Internal ID
  id: string;

  // Nyaa information
  nyaaId: string;
  title: string;
  category: string;
  magnetLink: string;
  torrentLink?: string;
  infoHash: string;

  // Size and files
  size: string; // e.g., "1.2 GB"
  sizeBytes: number;
  fileCount?: number;

  // Seeders and leechers
  seeders: number;
  leechers: number;
  downloads: number;

  // Dates
  publishedAt: Date;
  lastChecked?: Date;

  // Associations
  animeId?: string; // Link to Anime
  episodeIds?: string[]; // Link to Episode(s)
  seasonId?: string; // Link to Season
  episodeNumber?: number; // For single episode
  episodeRange?: EpisodeRange; // For batch

  // Metadata
  metadata: TorrentMetadata;

  // Additional info
  description?: string;
  comments?: number;
  trusted?: boolean;
  remake?: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Torrent search filters
 */
export interface TorrentSearchFilter {
  animeId?: string;
  episodeId?: string;
  seasonId?: string;
  episodeNumber?: number;
  quality?: TorrentQuality;
  audioLanguage?: TorrentLanguage;
  subtitleLanguage?: TorrentLanguage;
  releaseType?: TorrentReleaseType;
  minSeeders?: number;
  trustedOnly?: boolean;
}

/**
 * Torrent statistics
 */
export interface TorrentStats {
  totalTorrents: number;
  byQuality: Record<TorrentQuality, number>;
  byLanguage: Record<TorrentLanguage, number>;
  byReleaseType: Record<TorrentReleaseType, number>;
  averageSeeders: number;
  totalSize: number;
}
