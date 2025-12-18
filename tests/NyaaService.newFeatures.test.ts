import { NyaaService, NyaaServiceOptions } from '../src/services/NyaaService';
import { InMemoryTorrentRepository } from '../src/repositories/TorrentRepository';
import {
  Torrent,
  TorrentQuality,
  TorrentLanguage,
  TorrentCodec,
  TorrentReleaseType,
} from '../src/models/Torrent';

describe('NyaaService - New Features', () => {
  let service: NyaaService;
  let torrentRepo: InMemoryTorrentRepository;
  const testAnimeId = 'test-anime-123';

  beforeEach(() => {
    torrentRepo = new InMemoryTorrentRepository();
    const options: NyaaServiceOptions = {
      enableCache: true,
      cacheTTL: 3600,
      timeout: 30000,
      maxRetries: 3,
    };
    service = new NyaaService(torrentRepo, options);
  });

  afterEach(() => {
    // Clear cache after each test
    service.clearCache();
  });

  describe('getMetrics', () => {
    it('should return initial metrics', () => {
      const metrics = service.getMetrics();
      expect(metrics).toHaveProperty('totalSearches');
      expect(metrics).toHaveProperty('cacheHits');
      expect(metrics).toHaveProperty('cacheMisses');
      expect(metrics).toHaveProperty('totalTorrentsIndexed');
      expect(metrics).toHaveProperty('failedSearches');
      expect(metrics).toHaveProperty('cacheHitRate');

      expect(metrics.totalSearches).toBe(0);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache successfully', () => {
      expect(() => service.clearCache()).not.toThrow();
    });

    it('should work even with cache disabled', () => {
      const noCacheService = new NyaaService(torrentRepo, {
        enableCache: false,
      });
      expect(() => noCacheService.clearCache()).not.toThrow();
    });
  });

  describe('getTorrentsByQuality', () => {
    beforeEach(async () => {
      // Create test torrents with different qualities
      const torrents: Torrent[] = [
        {
          id: '1',
          nyaaId: '1001',
          animeId: testAnimeId,
          title: 'Test Anime - 01 [480p]',
          category: '1_2',
          magnetLink: 'magnet:?xt=urn:btih:' + 'a'.repeat(40),
          infoHash: 'a'.repeat(40),
          size: '200 MiB',
          sizeBytes: 209715200,
          seeders: 10,
          leechers: 2,
          downloads: 50,
          publishedAt: new Date(),
          metadata: {
            quality: TorrentQuality.SD_480p,
            codec: TorrentCodec.H264,
            audioLanguages: [TorrentLanguage.JAPANESE],
            subtitleLanguages: [TorrentLanguage.ENGLISH],
            releaseType: TorrentReleaseType.EPISODE,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          nyaaId: '1002',
          animeId: testAnimeId,
          title: 'Test Anime - 01 [1080p]',
          category: '1_2',
          magnetLink: 'magnet:?xt=urn:btih:' + 'b'.repeat(40),
          infoHash: 'b'.repeat(40),
          size: '1.2 GiB',
          sizeBytes: 1288490188,
          seeders: 100,
          leechers: 20,
          downloads: 500,
          publishedAt: new Date(),
          metadata: {
            quality: TorrentQuality.FULL_HD_1080p,
            codec: TorrentCodec.H264,
            audioLanguages: [TorrentLanguage.JAPANESE],
            subtitleLanguages: [TorrentLanguage.ENGLISH],
            releaseType: TorrentReleaseType.EPISODE,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          nyaaId: '1003',
          animeId: testAnimeId,
          title: 'Test Anime - 01 [720p]',
          category: '1_2',
          magnetLink: 'magnet:?xt=urn:btih:' + 'c'.repeat(40),
          infoHash: 'c'.repeat(40),
          size: '600 MiB',
          sizeBytes: 629145600,
          seeders: 50,
          leechers: 10,
          downloads: 200,
          publishedAt: new Date(),
          metadata: {
            quality: TorrentQuality.HD_720p,
            codec: TorrentCodec.H264,
            audioLanguages: [TorrentLanguage.JAPANESE],
            subtitleLanguages: [TorrentLanguage.ENGLISH],
            releaseType: TorrentReleaseType.EPISODE,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const torrent of torrents) {
        await torrentRepo.save(torrent);
      }
    });

    it('should return torrents filtered by quality', async () => {
      const fullHDTorrents = await service.getTorrentsByQuality(
        testAnimeId,
        TorrentQuality.FULL_HD_1080p
      );
      expect(fullHDTorrents).toHaveLength(1);
      expect(fullHDTorrents[0].metadata.quality).toBe(
        TorrentQuality.FULL_HD_1080p
      );
    });

    it('should return empty array if no torrents match quality', async () => {
      const uhd4KTorrents = await service.getTorrentsByQuality(
        testAnimeId,
        TorrentQuality.UHD_4K
      );
      expect(uhd4KTorrents).toHaveLength(0);
    });

    it('should return empty array for non-existent anime', async () => {
      const torrents = await service.getTorrentsByQuality(
        'non-existent-anime',
        TorrentQuality.HD_720p
      );
      expect(torrents).toHaveLength(0);
    });
  });

  describe('getBestQualityForEpisode', () => {
    beforeEach(async () => {
      // Create test torrents for episode 1
      const torrents: Torrent[] = [
        {
          id: '1',
          nyaaId: '1001',
          animeId: testAnimeId,
          episodeNumber: 1,
          title: 'Test Anime - 01 [480p]',
          category: '1_2',
          magnetLink: 'magnet:?xt=urn:btih:' + 'a'.repeat(40),
          infoHash: 'a'.repeat(40),
          size: '200 MiB',
          sizeBytes: 209715200,
          seeders: 10,
          leechers: 2,
          downloads: 50,
          publishedAt: new Date(),
          metadata: {
            quality: TorrentQuality.SD_480p,
            codec: TorrentCodec.H264,
            audioLanguages: [TorrentLanguage.JAPANESE],
            subtitleLanguages: [TorrentLanguage.ENGLISH],
            releaseType: TorrentReleaseType.EPISODE,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          nyaaId: '1002',
          animeId: testAnimeId,
          episodeNumber: 1,
          title: 'Test Anime - 01 [1080p]',
          category: '1_2',
          magnetLink: 'magnet:?xt=urn:btih:' + 'b'.repeat(40),
          infoHash: 'b'.repeat(40),
          size: '1.2 GiB',
          sizeBytes: 1288490188,
          seeders: 100,
          leechers: 20,
          downloads: 500,
          publishedAt: new Date(),
          metadata: {
            quality: TorrentQuality.FULL_HD_1080p,
            codec: TorrentCodec.H264,
            audioLanguages: [TorrentLanguage.JAPANESE],
            subtitleLanguages: [TorrentLanguage.ENGLISH],
            releaseType: TorrentReleaseType.EPISODE,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          nyaaId: '1003',
          animeId: testAnimeId,
          episodeNumber: 1,
          title: 'Test Anime - 01 [720p]',
          category: '1_2',
          magnetLink: 'magnet:?xt=urn:btih:' + 'c'.repeat(40),
          infoHash: 'c'.repeat(40),
          size: '600 MiB',
          sizeBytes: 629145600,
          seeders: 50,
          leechers: 10,
          downloads: 200,
          publishedAt: new Date(),
          metadata: {
            quality: TorrentQuality.HD_720p,
            codec: TorrentCodec.H264,
            audioLanguages: [TorrentLanguage.JAPANESE],
            subtitleLanguages: [TorrentLanguage.ENGLISH],
            releaseType: TorrentReleaseType.EPISODE,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const torrent of torrents) {
        await torrentRepo.save(torrent);
      }
    });

    it('should return the best quality (1080p)', async () => {
      const bestQuality = await service.getBestQualityForEpisode(
        testAnimeId,
        1
      );
      expect(bestQuality).toBe(TorrentQuality.FULL_HD_1080p);
    });

    it('should return null for non-existent episode', async () => {
      const bestQuality = await service.getBestQualityForEpisode(
        testAnimeId,
        999
      );
      expect(bestQuality).toBeNull();
    });

    it('should return null for non-existent anime', async () => {
      const bestQuality = await service.getBestQualityForEpisode(
        'non-existent-anime',
        1
      );
      expect(bestQuality).toBeNull();
    });
  });

  describe('refreshAllTorrents', () => {
    it('should handle non-existent anime gracefully', async () => {
      const result = await service.refreshAllTorrents('non-existent-anime');
      expect(typeof result).toBe('number');
      expect(result).toBe(0);
    });

    it('should return number of updated torrents', async () => {
      const result = await service.refreshAllTorrents(testAnimeId);
      expect(typeof result).toBe('number');
    });
  });

  describe('Cache Functionality', () => {
    it('should initialize with cache enabled', () => {
      const cachedService = new NyaaService(torrentRepo, {
        enableCache: true,
      });
      expect(cachedService).toBeDefined();
    });

    it('should initialize without cache', () => {
      const noCacheService = new NyaaService(torrentRepo, {
        enableCache: false,
      });
      expect(noCacheService).toBeDefined();
    });

    it('should use custom cache TTL', () => {
      const customService = new NyaaService(torrentRepo, {
        enableCache: true,
        cacheTTL: 7200, // 2 hours
      });
      expect(customService).toBeDefined();
    });
  });

  describe('Retry and Timeout Configuration', () => {
    it('should accept custom timeout', () => {
      const timeoutService = new NyaaService(torrentRepo, {
        timeout: 60000, // 1 minute
      });
      expect(timeoutService).toBeDefined();
    });

    it('should accept custom retry count', () => {
      const retryService = new NyaaService(torrentRepo, {
        maxRetries: 5,
      });
      expect(retryService).toBeDefined();
    });
  });
});
