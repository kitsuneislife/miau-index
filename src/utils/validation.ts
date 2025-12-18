import { z } from 'zod';
import { AnimeType, AnimeStatus, Season, AgeRating, DataSource } from '../types/common';
import { RelationType, AdaptationType } from '../models/Anime';
import { CharacterRole } from '../models/People';

/**
 * Zod schemas for runtime validation
 */

// Common schemas
export const ExternalIdSchema = z.object({
  source: z.nativeEnum(DataSource),
  id: z.string(),
});

export const DateRangeSchema = z.object({
  start: z.date().optional(),
  end: z.date().optional(),
});

export const ImageSchema = z.object({
  small: z.string().url().optional(),
  medium: z.string().url().optional(),
  large: z.string().url().optional(),
  original: z.string().url().optional(),
});

export const TitleSchema = z.object({
  romaji: z.string().optional(),
  english: z.string().optional(),
  native: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
});

export const RatingSchema = z.object({
  source: z.nativeEnum(DataSource),
  score: z.number().min(0).max(10).optional(),
  votes: z.number().int().nonnegative().optional(),
  rank: z.number().int().positive().optional(),
  popularity: z.number().int().nonnegative().optional(),
});

// Anime schemas
export const AnimeRelationSchema = z.object({
  animeId: z.string(),
  relationType: z.nativeEnum(RelationType),
});

export const AdaptationSchema = z.object({
  type: z.nativeEnum(AdaptationType),
  title: z.string(),
  url: z.string().url().optional(),
});

export const AnimeSchema = z.object({
  id: z.string(),
  title: TitleSchema,
  type: z.nativeEnum(AnimeType),
  status: z.nativeEnum(AnimeStatus),
  episodes: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  season: z.nativeEnum(Season).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  synopsis: z.string().optional(),
  background: z.string().optional(),
  images: ImageSchema,
  trailer: z
    .object({
      url: z.string().url().optional(),
      embedUrl: z.string().url().optional(),
    })
    .optional(),
  aired: DateRangeSchema,
  broadcast: z
    .object({
      day: z.string().optional(),
      time: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  ratings: z.array(RatingSchema),
  ageRating: z.nativeEnum(AgeRating).optional(),
  genres: z.array(z.string()),
  themes: z.array(z.string()),
  demographics: z.array(z.string()).optional(),
  studios: z.array(z.string()),
  producers: z.array(z.string()),
  licensors: z.array(z.string()),
  relations: z.array(AnimeRelationSchema).optional(),
  adaptations: z.array(AdaptationSchema).optional(),
  externalIds: z.array(ExternalIdSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastSyncedAt: z.date(),
});

// Episode schemas
export const EpisodeSchema = z.object({
  id: z.string(),
  animeId: z.string(),
  number: z.number().int().positive(),
  title: z.string().optional(),
  titleJapanese: z.string().optional(),
  titleRomaji: z.string().optional(),
  synopsis: z.string().optional(),
  duration: z.number().int().positive().optional(),
  images: ImageSchema.optional(),
  aired: z.date().optional(),
  filler: z.boolean().optional(),
  recap: z.boolean().optional(),
  externalIds: z.array(ExternalIdSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AnimeSeasonSchema = z.object({
  id: z.string(),
  animeId: z.string(),
  seasonNumber: z.number().int().positive(),
  title: z.string().optional(),
  episodeCount: z.number().int().nonnegative().optional(),
  episodes: z.array(EpisodeSchema).optional(),
  aired: DateRangeSchema.optional(),
  externalIds: z.array(ExternalIdSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// People schemas
export const VoiceActorSchema = z.object({
  id: z.string(),
  name: z.object({
    full: z.string().optional(),
    native: z.string().optional(),
  }),
  language: z.string().optional(),
  image: z.string().url().optional(),
  externalIds: z.array(ExternalIdSchema),
});

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.object({
    full: z.string().optional(),
    native: z.string().optional(),
    alternative: z.array(z.string()).optional(),
  }),
  description: z.string().optional(),
  image: z.string().url().optional(),
  role: z.nativeEnum(CharacterRole).optional(),
  voiceActors: z.array(VoiceActorSchema).optional(),
  externalIds: z.array(ExternalIdSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const StaffMemberSchema = z.object({
  id: z.string(),
  name: z.object({
    full: z.string().optional(),
    native: z.string().optional(),
  }),
  role: z.string().optional(),
  image: z.string().url().optional(),
  externalIds: z.array(ExternalIdSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const StudioSchema = z.object({
  id: z.string(),
  name: z.string(),
  favorites: z.number().int().nonnegative().optional(),
  externalIds: z.array(ExternalIdSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Validation helper functions
 */
export function validateAnime(data: unknown): z.infer<typeof AnimeSchema> {
  return AnimeSchema.parse(data);
}

export function validateEpisode(data: unknown): z.infer<typeof EpisodeSchema> {
  return EpisodeSchema.parse(data);
}

export function validateCharacter(data: unknown): z.infer<typeof CharacterSchema> {
  return CharacterSchema.parse(data);
}

export function isValidAnime(data: unknown): boolean {
  return AnimeSchema.safeParse(data).success;
}

export function isValidEpisode(data: unknown): boolean {
  return EpisodeSchema.safeParse(data).success;
}
