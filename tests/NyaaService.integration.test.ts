import { NyaaService } from '../src/services/NyaaService';
import { InMemoryTorrentRepository } from '../src/repositories/TorrentRepository';
import { Anime } from '../src/models/Anime';
import { AnimeType, AnimeStatus } from '../src/types/common';
import { TorrentQuality } from '../src/models/Torrent';

/**
 * Integration tests for NyaaService - REAL API CALLS
 * 
 * These tests make actual calls to Nyaa.si API
 * Run with: npm test -- --testPathPattern=NyaaService.integration
 */
describe('NyaaService - Integration Tests', () => {
  let service: NyaaService;
  let repository: InMemoryTorrentRepository;
  let testAnime: Anime;

  beforeAll(() => {
    // Use a well-known anime for consistent testing
    testAnime = {
      id: 'cowboy-bebop-1',
      title: {
        romaji: 'Cowboy Bebop',
        english: 'Cowboy Bebop',
        native: 'カウボーイビバップ',
      },
      type: AnimeType.TV,
      status: AnimeStatus.FINISHED,
      episodes: 26,
      images: {},
      aired: {},
      ratings: [],
      genres: [],
      themes: [],
      studios: [],
      producers: [],
      licensors: [],
      externalIds: [
        { source: 'ANILIST' as any, id: '1' },
        { source: 'MYANIMELIST' as any, id: '1' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    };
  });

  beforeEach(() => {
    repository = new InMemoryTorrentRepository();
    service = new NyaaService(repository, {
      autoIndex: true,
      minSeeders: 1,
      trustedOnly: false,
      maxResults: 10, // Limit for faster tests
    });
  });

  describe('Real API - indexAnime', () => {
    it('should fetch and index real torrents from Nyaa', async () => {
      const torrents = await service.indexAnime(testAnime);

      // Validate results
      expect(torrents).toBeDefined();
      expect(Array.isArray(torrents)).toBe(true);
      expect(torrents.length).toBeGreaterThan(0);

      // Check first torrent structure
      const firstTorrent = torrents[0];
      expect(firstTorrent).toHaveProperty('id');
      expect(firstTorrent).toHaveProperty('title');
      expect(firstTorrent).toHaveProperty('magnetLink');
      expect(firstTorrent).toHaveProperty('seeders');
      expect(firstTorrent).toHaveProperty('leechers');
      expect(firstTorrent).toHaveProperty('size');
      expect(firstTorrent).toHaveProperty('metadata');
      expect(firstTorrent.animeId).toBe(testAnime.id);

      // Validate metadata extraction
      expect(firstTorrent.metadata).toHaveProperty('quality');
      expect(firstTorrent.metadata).toHaveProperty('audioLanguages');
      expect(firstTorrent.metadata).toHaveProperty('subtitleLanguages');

      console.log(`✓ Indexed ${torrents.length} torrents for ${testAnime.title.romaji}`);
      console.log(`  First torrent: ${firstTorrent.title}`);
      console.log(`  Quality: ${firstTorrent.metadata.quality}`);
      console.log(`  Seeders: ${firstTorrent.seeders}`);
    }, 15000); // 15s timeout for API call

    it('should save torrents to repository when autoIndex is true', async () => {
      const torrents = await service.indexAnime(testAnime);
      
      // Verify saved to repository
      const repoCount = await repository.count();
      expect(repoCount).toBe(torrents.length);
      expect(repoCount).toBeGreaterThan(0);

      // Verify we can retrieve them
      const savedTorrents = await repository.findByAnimeId(testAnime.id);
      expect(savedTorrents.length).toBe(torrents.length);
    }, 15000);
  });

  describe('Real API - indexEpisode', () => {
    it('should fetch torrents for specific episode', async () => {
      const episodeNumber = 1;
      const torrents = await service.indexEpisode(testAnime, episodeNumber);

      expect(torrents).toBeDefined();
      expect(torrents.length).toBeGreaterThan(0);

      // All torrents should be for episode 1
      torrents.forEach(torrent => {
        const matchesEpisode = 
          torrent.episodeNumber === episodeNumber ||
          (torrent.episodeRange && 
           torrent.episodeRange.start <= episodeNumber && 
           torrent.episodeRange.end >= episodeNumber);
        
        expect(matchesEpisode).toBe(true);
      });

      console.log(`✓ Found ${torrents.length} torrents for episode ${episodeNumber}`);
    }, 15000);
  });

  describe('Real API - metadata extraction', () => {
    it('should correctly extract quality from torrent titles', async () => {
      const torrents = await service.indexAnime(testAnime);
      
      // Find torrents with quality in title
      const torrentsWith1080p = torrents.filter(t => 
        t.title.toLowerCase().includes('1080p')
      );

      if (torrentsWith1080p.length > 0) {
        torrentsWith1080p.forEach(t => {
          expect(t.metadata.quality).toBe(TorrentQuality.FULL_HD_1080p);
        });
        console.log(`✓ Quality extraction verified on ${torrentsWith1080p.length} torrents`);
      }
    }, 15000);

    it('should detect batch torrents', async () => {
      const torrents = await service.indexAnime(testAnime);
      
      const batchTorrents = torrents.filter(t => t.metadata.isBatch);
      
      if (batchTorrents.length > 0) {
        batchTorrents.forEach(t => {
          expect(t.episodeRange).toBeDefined();
          expect(t.episodeRange!.start).toBeLessThanOrEqual(t.episodeRange!.end);
        });
        console.log(`✓ Found ${batchTorrents.length} batch torrents`);
      }
    }, 15000);

    it('should extract release group from titles', async () => {
      const torrents = await service.indexAnime(testAnime);
      
      const torrentsWithGroup = torrents.filter(t => t.metadata.releaseGroup);
      
      expect(torrentsWithGroup.length).toBeGreaterThan(0);
      
      console.log(`✓ Extracted release groups from ${torrentsWithGroup.length} torrents`);
      console.log(`  Examples: ${torrentsWithGroup.slice(0, 3).map(t => t.metadata.releaseGroup).join(', ')}`);
    }, 15000);
  });

  describe('Real API - searchTorrents', () => {
    it('should filter by quality', async () => {
      // First index some torrents
      await service.indexAnime(testAnime);

      // Search for 1080p only
      const results = await service.searchTorrents(testAnime, {
        quality: TorrentQuality.FULL_HD_1080p,
      });

      results.forEach(t => {
        expect(t.metadata.quality).toBe(TorrentQuality.FULL_HD_1080p);
      });

      console.log(`✓ Found ${results.length} 1080p torrents`);
    }, 15000);

    it('should filter by minimum seeders', async () => {
      await service.indexAnime(testAnime);

      const minSeeders = 5;
      const results = await service.searchTorrents(testAnime, {
        minSeeders,
      });

      results.forEach(t => {
        expect(t.seeders).toBeGreaterThanOrEqual(minSeeders);
      });

      console.log(`✓ Found ${results.length} torrents with ${minSeeders}+ seeders`);
    }, 15000);
  });

  describe('Real API - getBestTorrentForEpisode', () => {
    it('should return best torrent for episode', async () => {
      await service.indexAnime(testAnime);

      const best = await service.getBestTorrentForEpisode(testAnime, 1);

      if (best) {
        expect(best.episodeNumber).toBe(1);
        expect(best.seeders).toBeGreaterThan(0);
        
        console.log(`✓ Best torrent for episode 1:`);
        console.log(`  Title: ${best.title}`);
        console.log(`  Quality: ${best.metadata.quality}`);
        console.log(`  Seeders: ${best.seeders}`);
        console.log(`  Size: ${best.size}`);
      }
    }, 15000);

    it('should prefer specified quality', async () => {
      await service.indexAnime(testAnime);

      const best720p = await service.getBestTorrentForEpisode(
        testAnime, 
        1, 
        TorrentQuality.HD_720p
      );

      if (best720p) {
        expect(best720p.metadata.quality).toBe(TorrentQuality.HD_720p);
        console.log(`✓ Preferred quality respected: ${best720p.metadata.quality}`);
      }
    }, 15000);
  });

  describe('Real API - getTorrentStats', () => {
    it('should generate accurate statistics', async () => {
      await service.indexAnime(testAnime);

      const stats = await service.getTorrentStats(testAnime.id);

      expect(stats).toBeDefined();
      expect(stats.totalTorrents).toBeGreaterThan(0);
      expect(stats.averageSeeders).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(Object.keys(stats.byQuality).length).toBeGreaterThan(0);

      console.log(`✓ Statistics:`);
      console.log(`  Total torrents: ${stats.totalTorrents}`);
      console.log(`  Average seeders: ${Math.round(stats.averageSeeders)}`);
      console.log(`  Total size: ${(stats.totalSize / 1024 ** 3).toFixed(2)} GB`);
      console.log(`  Qualities:`, Object.entries(stats.byQuality).map(([q, c]) => `${q}:${c}`).join(', '));
    }, 15000);
  });

  describe('Real API - refreshTorrent', () => {
    it('should update torrent information', async () => {
      const torrents = await service.indexAnime(testAnime);
      
      if (torrents.length > 0) {
        const torrent = torrents[0];
        const originalSeeders = torrent.seeders;

        // Wait a moment then refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const refreshed = await service.refreshTorrent(torrent.id);

        expect(refreshed).toBeDefined();
        expect(refreshed!.id).toBe(torrent.id);
        expect(refreshed!.lastChecked).toBeDefined();
        
        console.log(`✓ Torrent refreshed`);
        console.log(`  Seeders: ${originalSeeders} → ${refreshed!.seeders}`);
      }
    }, 20000);
  });

  describe('Real API - error handling', () => {
    it('should handle invalid anime gracefully', async () => {
      const invalidAnime: Anime = {
        ...testAnime,
        id: 'invalid-anime',
        title: {
          romaji: 'ThisAnimeDefinitelyDoesNotExist12345XYZ',
          english: '',
          native: '',
        },
      };

      // Should not throw, just return empty array
      const torrents = await service.indexAnime(invalidAnime);
      expect(Array.isArray(torrents)).toBe(true);
      
      console.log(`✓ Handled invalid anime, returned ${torrents.length} torrents`);
    }, 15000);
  });
});

/**
 * Performance tests
 */
describe('NyaaService - Performance Tests', () => {
  let service: NyaaService;
  let repository: InMemoryTorrentRepository;

  beforeEach(() => {
    repository = new InMemoryTorrentRepository();
    service = new NyaaService(repository, {
      autoIndex: true,
      minSeeders: 1,
    });
  });

  it('should handle multiple sequential searches efficiently', async () => {
    const animes = [
      { id: '1', title: 'Cowboy Bebop' },
      { id: '2', title: 'Trigun' },
      { id: '3', title: 'Samurai Champloo' },
    ];

    const startTime = Date.now();

    for (const animeData of animes) {
      const anime: Anime = {
        id: animeData.id,
        title: {
          romaji: animeData.title,
          english: animeData.title,
          native: '',
        },
        type: AnimeType.TV,
        status: AnimeStatus.FINISHED,
        episodes: 24,
        images: {},
        aired: {},
        ratings: [],
        genres: [],
        themes: [],
        studios: [],
        producers: [],
        licensors: [],
        externalIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
      };

      await service.indexAnime(anime);
    }

    const duration = Date.now() - startTime;
    
    console.log(`✓ Indexed ${animes.length} animes in ${duration}ms`);
    console.log(`  Average: ${Math.round(duration / animes.length)}ms per anime`);
    
    // Should complete in reasonable time
    expect(duration).toBeLessThan(60000); // 1 minute max
  }, 60000);
});
