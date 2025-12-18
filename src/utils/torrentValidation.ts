import { z } from 'zod';
import {
  TorrentQuality,
  TorrentLanguage,
  TorrentCodec,
  TorrentReleaseType,
} from '../models/Torrent';

/**
 * Zod schemas for Torrent validation
 */

export const EpisodeRangeSchema = z.object({
  start: z.number().int().positive(),
  end: z.number().int().positive(),
});

export const TorrentMetadataSchema = z.object({
  quality: z.nativeEnum(TorrentQuality),
  codec: z.nativeEnum(TorrentCodec),
  audioLanguages: z.array(z.nativeEnum(TorrentLanguage)),
  subtitleLanguages: z.array(z.nativeEnum(TorrentLanguage)),
  releaseType: z.nativeEnum(TorrentReleaseType),
  releaseGroup: z.string().optional(),
  isDual: z.boolean().optional(),
  isMultiSub: z.boolean().optional(),
  isBatch: z.boolean().optional(),
  hasHardSubs: z.boolean().optional(),
});

export const TorrentSchema = z.object({
  id: z.string().uuid(),
  nyaaId: z.string(),
  title: z.string().min(1),
  category: z.string(),
  magnetLink: z.string().startsWith('magnet:'),
  torrentLink: z.string().url().optional(),
  infoHash: z.string().regex(/^[a-f0-9]{40}$/i),
  size: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  fileCount: z.number().int().positive().optional(),
  seeders: z.number().int().nonnegative(),
  leechers: z.number().int().nonnegative(),
  downloads: z.number().int().nonnegative(),
  publishedAt: z.date(),
  lastChecked: z.date().optional(),
  animeId: z.string().optional(),
  episodeIds: z.array(z.string()).optional(),
  seasonId: z.string().optional(),
  episodeNumber: z.number().int().positive().optional(),
  episodeRange: EpisodeRangeSchema.optional(),
  metadata: TorrentMetadataSchema,
  description: z.string().optional(),
  comments: z.number().int().nonnegative().optional(),
  trusted: z.boolean().optional(),
  remake: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const TorrentSearchFilterSchema = z.object({
  animeId: z.string().optional(),
  episodeId: z.string().optional(),
  seasonId: z.string().optional(),
  episodeNumber: z.number().int().positive().optional(),
  quality: z.nativeEnum(TorrentQuality).optional(),
  audioLanguage: z.nativeEnum(TorrentLanguage).optional(),
  subtitleLanguage: z.nativeEnum(TorrentLanguage).optional(),
  releaseType: z.nativeEnum(TorrentReleaseType).optional(),
  minSeeders: z.number().int().nonnegative().optional(),
  trustedOnly: z.boolean().optional(),
});

/**
 * Validation helper functions
 */
export function validateTorrent(data: unknown): z.infer<typeof TorrentSchema> {
  return TorrentSchema.parse(data);
}

export function isValidTorrent(data: unknown): boolean {
  return TorrentSchema.safeParse(data).success;
}

export function validateTorrentSearchFilter(
  data: unknown
): z.infer<typeof TorrentSearchFilterSchema> {
  return TorrentSearchFilterSchema.parse(data);
}

/**
 * Sanitize search query for Nyaa
 * Removes dangerous characters and normalizes whitespace
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 200); // Limit length
}

/**
 * Validate episode number
 */
export function isValidEpisodeNumber(episodeNumber: number): boolean {
  return Number.isInteger(episodeNumber) && episodeNumber > 0 && episodeNumber <= 10000;
}

/**
 * Validate episode range
 */
export function isValidEpisodeRange(start: number, end: number): boolean {
  return (
    isValidEpisodeNumber(start) &&
    isValidEpisodeNumber(end) &&
    start <= end &&
    end - start <= 1000 // Reasonable limit
  );
}
