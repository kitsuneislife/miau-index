// Main MiauIndex class
export { MiauIndex, MiauIndexConfig } from './MiauIndex';

// Models
export * from './models/Anime';
export * from './models/Episode';
export * from './models/People';
export * from './models/Torrent'; // Export Torrent models

// Types
export * from './types/common';

// Providers
export { BaseAnimeProvider, IAnimeProvider } from './providers/BaseProvider';
export { MyAnimeListProvider, AniListProvider, KitsuProvider } from './providers';

// Repositories
export { IAnimeRepository, InMemoryAnimeRepository } from './repositories/AnimeRepository';
export { IEpisodeRepository, InMemoryEpisodeRepository } from './repositories/EpisodeRepository';
export { ITorrentRepository, InMemoryTorrentRepository } from './repositories/TorrentRepository'; // Export Torrent repository

// Services
export { AnimeUnificationService, UnificationOptions } from './services/AnimeUnificationService';
export { NyaaService, NyaaServiceOptions } from './services/NyaaService'; // Export Nyaa service

// Utilities
export * from './utils/logger';
export * from './utils/errors';
export * from './utils/validation';
export * from './utils/torrentValidation'; // Export torrent validation
export * from './utils/cache';
export * from './utils/rateLimiter';
export * from './utils/helpers';
export * from './utils/httpClient';

// Config
export { loadConfig } from './config';
