import { MiauIndex } from '../src/MiauIndex';
import { Anime } from '../src/models/Anime';
import { Episode, AnimeSeason } from '../src/models/Episode';

describe('Episode and Season System', () => {
  let miauIndex: MiauIndex;

  beforeEach(() => {
    miauIndex = new MiauIndex({
      enableLogging: false,
    });
  });

  describe('Episode Fetching', () => {
    it('should fetch episodes from providers', async () => {
      // Search for an anime
      const results = await miauIndex.searchAnime('Steins Gate');
      expect(results.length).toBeGreaterThan(0);

      const anime = results[0];
      expect(anime).toBeDefined();
      expect(anime.id).toBeDefined();

      // Fetch episodes
      const episodes = await miauIndex.getEpisodes(anime);
      
      // Should return episodes array (may be empty if providers don't have data)
      expect(Array.isArray(episodes)).toBe(true);
      
      if (episodes.length > 0) {
        const firstEpisode = episodes[0];
        expect(firstEpisode.id).toBeDefined();
        expect(firstEpisode.animeId).toBe(anime.id);
        expect(firstEpisode.number).toBeGreaterThan(0);
        expect(firstEpisode.createdAt).toBeInstanceOf(Date);
        expect(firstEpisode.updatedAt).toBeInstanceOf(Date);
      }
    }, 30000);

    it('should fetch anime with complete episode data', async () => {
      const results = await miauIndex.searchAnime('Cowboy Bebop');
      expect(results.length).toBeGreaterThan(0);

      const anime = results[0];
      
      // Save anime to repository first so getAnimeWithEpisodes can find it
      await (miauIndex as any).repository.save(anime);
      
      const completeData = await miauIndex.getAnimeWithEpisodes(anime.id);

      expect(completeData).toBeDefined();
      expect(completeData.anime).toBeDefined();
      expect(completeData.anime.id).toBe(anime.id);
      expect(Array.isArray(completeData.episodes)).toBe(true);
      
      // Seasons may or may not be present depending on episode count
      if (completeData.seasons) {
        expect(Array.isArray(completeData.seasons)).toBe(true);
      }
    }, 30000);
  });

  describe('Season Organization', () => {
    it('should auto-organize episodes into seasons for multi-season anime', async () => {
      // Create test anime with many episodes
      const anime: Anime = {
        id: 'test-anime-1',
        title: {
          romaji: 'Test Long Anime',
          english: 'Test Long Anime',
        },
        type: 'TV' as any,
        status: 'FINISHED' as any,
        episodes: 50,
        images: {
          original: 'test.jpg',
        },
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

      // Create episodes (50 episodes)
      const episodes: Episode[] = [];
      for (let i = 1; i <= 50; i++) {
        episodes.push({
          id: `test-ep-${i}`,
          animeId: anime.id,
          number: i,
          title: `Episode ${i}`,
          externalIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Organize into seasons
      await (miauIndex as any).organizeIntoSeasons(anime.id, episodes);

      // Should create multiple seasons (50 episodes = ~4 seasons at 13 eps each)
      const seasons = await (miauIndex as any).seasonRepository.findByAnimeId(anime.id);
      expect(seasons.length).toBeGreaterThan(1);
      expect(seasons.length).toBeLessThanOrEqual(4);

      // Verify season structure
      seasons.forEach((season: AnimeSeason, index: number) => {
        expect(season.id).toBeDefined();
        expect(season.animeId).toBe(anime.id);
        expect(season.seasonNumber).toBe(index + 1);
        if (season.episodes) {
          expect(season.episodes.length).toBeGreaterThan(0);
          expect(season.episodeCount).toBe(season.episodes.length);
        }
      });
    });

    it('should create single season for short anime', async () => {
      const anime: Anime = {
        id: 'test-anime-2',
        title: {
          romaji: 'Test Short Anime',
          english: 'Test Short Anime',
        },
        type: 'TV' as any,
        status: 'FINISHED' as any,
        episodes: 12,
        images: {
          original: 'test.jpg',
        },
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

      // Create episodes (12 episodes)
      const episodes: Episode[] = [];
      for (let i = 1; i <= 12; i++) {
        episodes.push({
          id: `test-ep-${i}`,
          animeId: anime.id,
          number: i,
          title: `Episode ${i}`,
          externalIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await (miauIndex as any).organizeIntoSeasons(anime.id, episodes);

      const seasons = await (miauIndex as any).seasonRepository.findByAnimeId(anime.id);
      expect(seasons.length).toBe(1);
      expect(seasons[0].seasonNumber).toBe(1);
      expect(seasons[0].episodes.length).toBe(12);
    });
  });

  describe('Episode Metadata', () => {
    it('should preserve episode metadata fields', () => {
      const episode: Episode = {
        id: 'test-ep-1',
        animeId: 'test-anime',
        number: 1,
        title: 'Pilot Episode',
        synopsis: 'The first episode',
        duration: 24,
        aired: new Date('2020-01-01'),
        images: {
          small: 'thumb.jpg',
          medium: 'medium.jpg',
          large: 'large.jpg',
          original: 'original.jpg',
        },
        filler: false,
        recap: false,
        externalIds: [
          { source: 'ANILIST' as any, id: '123' },
          { source: 'KITSU' as any, id: '456' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Verify all fields are preserved
      expect(episode.id).toBe('test-ep-1');
      expect(episode.title).toBe('Pilot Episode');
      expect(episode.synopsis).toBe('The first episode');
      expect(episode.duration).toBe(24);
      expect(episode.aired).toBeInstanceOf(Date);
      expect(episode.images).toBeDefined();
      expect(episode.filler).toBe(false);
      expect(episode.recap).toBe(false);
      expect(episode.externalIds.length).toBe(2);
    });
  });

  describe('Episode Repository', () => {
    it('should save and retrieve episodes', async () => {
      const episode: Episode = {
        id: 'ep-test-1',
        animeId: 'anime-test-1',
        number: 1,
        title: 'Test Episode',
        externalIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repo = (miauIndex as any).episodeRepository;
      const saved = await repo.save(episode);

      expect(saved.id).toBe(episode.id);

      const found = await repo.findById(episode.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(episode.id);
      expect(found!.title).toBe('Test Episode');
    });

    it('should find episodes by anime ID', async () => {
      const animeId = 'anime-test-multi';
      const repo = (miauIndex as any).episodeRepository;

      // Save multiple episodes
      for (let i = 1; i <= 5; i++) {
        await repo.save({
          id: `ep-${animeId}-${i}`,
          animeId,
          number: i,
          title: `Episode ${i}`,
          externalIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const episodes = await repo.findByAnimeId(animeId);
      expect(episodes.length).toBe(5);
      expect(episodes.every((ep: Episode) => ep.animeId === animeId)).toBe(true);
      
      // Should be sorted by episode number
      for (let i = 0; i < episodes.length; i++) {
        expect(episodes[i].number).toBe(i + 1);
      }
    });
  });

  describe('Season Repository', () => {
    it('should save and retrieve seasons', async () => {
      const season: AnimeSeason = {
        id: 'season-test-1',
        animeId: 'anime-test-1',
        seasonNumber: 1,
        title: 'Season 1',
        episodeCount: 12,
        episodes: [],
        externalIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repo = (miauIndex as any).seasonRepository;
      const saved = await repo.save(season);

      expect(saved.id).toBe(season.id);

      const found = await repo.findById(season.id);
      expect(found).toBeDefined();
      expect(found!.seasonNumber).toBe(1);
      expect(found!.title).toBe('Season 1');
    });

    it('should find seasons by anime ID and season number', async () => {
      const animeId = 'anime-test-seasons';
      const repo = (miauIndex as any).seasonRepository;

      // Save multiple seasons
      await repo.save({
        id: 'season-1',
        animeId,
        seasonNumber: 1,
        episodeCount: 13,
        episodes: [],
        externalIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repo.save({
        id: 'season-2',
        animeId,
        seasonNumber: 2,
        episodeCount: 13,
        episodes: [],
        externalIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const season2 = await repo.findBySeasonNumber(animeId, 2);
      expect(season2).toBeDefined();
      expect(season2!.seasonNumber).toBe(2);

      const allSeasons = await repo.findByAnimeId(animeId);
      expect(allSeasons.length).toBe(2);
    });
  });
});
