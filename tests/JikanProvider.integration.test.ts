import { JikanProvider } from '../src/providers/JikanProvider';
import { DataSource, AnimeType, AnimeStatus } from '../src/types/common';

describe('JikanProvider', () => {
  let provider: JikanProvider;

  beforeEach(() => {
    provider = new JikanProvider();
  });

  describe('Provider Configuration', () => {
    it('should initialize with correct settings', () => {
      expect(provider).toBeDefined();
      expect(provider.getSource()).toBe(DataSource.MYANIMELIST);
    });

    it('should be available', async () => {
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('Anime Fetching', () => {
    it('should fetch anime by MAL ID', async () => {
      // Cowboy Bebop MAL ID: 1
      const anime = await provider.fetchAnimeById('1');

      expect(anime).toBeDefined();
      expect(anime!.title.romaji).toBeDefined();
      expect(anime!.title.english).toBeDefined();
      expect(anime!.type).toBeDefined();
      expect(anime!.status).toBeDefined();
      expect(anime!.synopsis).toBeDefined();
      expect(anime!.images).toBeDefined();
      expect(anime!.externalIds.length).toBeGreaterThan(0);
      expect(anime!.externalIds[0].source).toBe(DataSource.MYANIMELIST);
      expect(anime!.externalIds[0].id).toBe('1');
    }, 15000);

    it('should handle non-existent anime', async () => {
      const anime = await provider.fetchAnimeById('999999999');
      // Jikan may return null or throw error for non-existent IDs
      expect(anime === null || anime === undefined).toBe(true);
    }, 15000);

    it('should fetch anime with complete metadata', async () => {
      // Steins;Gate MAL ID: 9253
      const anime = await provider.fetchAnimeById('9253');

      expect(anime).toBeDefined();
      expect(anime!.title.romaji).toBeDefined();
      expect(anime!.genres.length).toBeGreaterThan(0);
      expect(anime!.ratings.length).toBe(1);
      expect(anime!.ratings[0].source).toBe(DataSource.MYANIMELIST);
      
      if (anime!.ratings[0].score) {
        expect(anime!.ratings[0].score).toBeGreaterThan(0);
        expect(anime!.ratings[0].score).toBeLessThanOrEqual(10);
      }

      expect(anime!.aired).toBeDefined();
      expect(anime!.createdAt).toBeInstanceOf(Date);
      expect(anime!.updatedAt).toBeInstanceOf(Date);
      expect(anime!.lastSyncedAt).toBeInstanceOf(Date);
    }, 15000);

    it('should map anime types correctly', async () => {
      // Movie: Kimi no Na wa (Your Name) MAL ID: 32281
      const movie = await provider.fetchAnimeById('32281');
      expect(movie).toBeDefined();
      expect(movie!.type).toBe(AnimeType.MOVIE);
    }, 15000);

    it('should map anime status correctly', async () => {
      // Currently Airing: Should find one, but may vary
      // Finished: Cowboy Bebop
      const finished = await provider.fetchAnimeById('1');
      expect(finished).toBeDefined();
      expect(finished!.status).toBe(AnimeStatus.FINISHED);
    }, 15000);
  });

  describe('Anime Search', () => {
    it('should search anime by title', async () => {
      const results = await provider.searchAnime('Steins Gate', 10);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(10);

      const firstResult = results[0];
      expect(firstResult.id).toBeDefined();
      expect(firstResult.title.romaji).toBeDefined();
      expect(firstResult.externalIds.length).toBeGreaterThan(0);
    }, 15000);

    it('should respect search limit', async () => {
      const results = await provider.searchAnime('Naruto', 5);

      expect(results.length).toBeLessThanOrEqual(5);
    }, 15000);

    it('should handle searches with no results', async () => {
      const results = await provider.searchAnime('ThisAnimeDefinitelyDoesNotExistXYZ12345', 10);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    }, 15000);

    it('should handle special characters in search', async () => {
      const results = await provider.searchAnime('Re:Zero', 5);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Seasonal Anime', () => {
    it('should fetch seasonal anime', async () => {
      const results = await provider.getSeasonalAnime(2023, 'winter');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstAnime = results[0];
      expect(firstAnime.id).toBeDefined();
      expect(firstAnime.title.romaji).toBeDefined();
    }, 15000);

    it('should handle different seasons', async () => {
      const winter = await provider.getSeasonalAnime(2023, 'winter');
      const spring = await provider.getSeasonalAnime(2023, 'spring');
      const summer = await provider.getSeasonalAnime(2023, 'summer');
      const fall = await provider.getSeasonalAnime(2023, 'fall');

      expect(winter.length).toBeGreaterThan(0);
      expect(spring.length).toBeGreaterThan(0);
      expect(summer.length).toBeGreaterThan(0);
      expect(fall.length).toBeGreaterThan(0);
    }, 60000);

    it('should map season enums correctly', async () => {
      const results = await provider.getSeasonalAnime(2023, 'summer');
      
      const animeWithSeason = results.find((a) => a.season !== undefined);
      if (animeWithSeason) {
        expect(animeWithSeason.season).toBeDefined();
        expect(['WINTER', 'SPRING', 'SUMMER', 'FALL']).toContain(animeWithSeason.season);
      }
    }, 15000);
  });

  describe('Episode Fetching', () => {
    it('should fetch episodes for anime', async () => {
      // Cowboy Bebop has 26 episodes
      const episodes = await provider.fetchEpisodes('test-anime-1', '1');

      expect(Array.isArray(episodes)).toBe(true);
      expect(episodes.length).toBeGreaterThan(0);

      if (episodes.length > 0) {
        const firstEpisode = episodes[0];
        expect(firstEpisode.id).toBeDefined();
        expect(firstEpisode.animeId).toBe('test-anime-1');
        expect(firstEpisode.number).toBeGreaterThan(0);
        expect(firstEpisode.title).toBeDefined();
        expect(firstEpisode.externalIds.length).toBeGreaterThan(0);
        expect(firstEpisode.externalIds[0].source).toBe(DataSource.MYANIMELIST);
      }
    }, 30000);

    it('should handle anime with many episodes (pagination)', async () => {
      // One Piece MAL ID: 21 (has 1000+ episodes)
      const episodes = await provider.fetchEpisodes('test-anime-op', '21');

      expect(Array.isArray(episodes)).toBe(true);
      expect(episodes.length).toBeGreaterThan(100); // Should handle pagination
    }, 60000);

    it('should preserve episode metadata', async () => {
      const episodes = await provider.fetchEpisodes('test-anime-1', '1');

      if (episodes.length > 0) {
        const episode = episodes[0];
        expect(episode.createdAt).toBeInstanceOf(Date);
        expect(episode.updatedAt).toBeInstanceOf(Date);
        
        // Jikan provides filler/recap info
        expect(typeof episode.filler).toBe('boolean');
        expect(typeof episode.recap).toBe('boolean');
      }
    }, 30000);

    it('should handle anime with no episodes data', async () => {
      // Some anime may not have episode data on Jikan
      const episodes = await provider.fetchEpisodes('test-anime-999', '999999');

      expect(Array.isArray(episodes)).toBe(true);
      // May be empty array if no data available
    }, 15000);
  });

  describe('Data Mapping', () => {
    it('should map titles correctly', async () => {
      const anime = await provider.fetchAnimeById('9253'); // Steins;Gate

      expect(anime!.title.romaji).toBeDefined();
      expect(anime!.title.english).toBeDefined();
      expect(anime!.title.native).toBeDefined(); // Japanese title
      
      if (anime!.title.synonyms) {
        expect(Array.isArray(anime!.title.synonyms)).toBe(true);
      }
    }, 15000);

    it('should map images correctly', async () => {
      const anime = await provider.fetchAnimeById('1');

      expect(anime!.images).toBeDefined();
      expect(anime!.images.small).toBeDefined();
      expect(anime!.images.medium).toBeDefined();
      expect(anime!.images.large).toBeDefined();
      expect(anime!.images.original).toBeDefined();
    }, 15000);

    it('should map genres and themes', async () => {
      const anime = await provider.fetchAnimeById('9253');

      expect(anime!.genres).toBeDefined();
      expect(Array.isArray(anime!.genres)).toBe(true);
      expect(anime!.genres.length).toBeGreaterThan(0);

      expect(anime!.themes).toBeDefined();
      expect(Array.isArray(anime!.themes)).toBe(true);
    }, 15000);

    it('should map studios and producers', async () => {
      const anime = await provider.fetchAnimeById('1');

      expect(anime!.studios).toBeDefined();
      expect(Array.isArray(anime!.studios)).toBe(true);
      
      expect(anime!.producers).toBeDefined();
      expect(Array.isArray(anime!.producers)).toBe(true);
    }, 15000);
  });

  describe('Rate Limiting', () => {
    it('should handle rate limits gracefully', async () => {
      const promises = [];

      // Make 10 rapid requests
      for (let i = 1; i <= 10; i++) {
        promises.push(provider.fetchAnimeById(i.toString()));
      }

      const results = await Promise.all(promises);

      // Should successfully complete despite rate limiting
      expect(results.length).toBe(10);
      const successfulResults = results.filter((r) => r !== null);
      expect(successfulResults.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Caching', () => {
    it('should cache search results', async () => {
      const start1 = Date.now();
      const results1 = await provider.searchAnime('Cowboy Bebop', 5);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const results2 = await provider.searchAnime('Cowboy Bebop', 5);
      const time2 = Date.now() - start2;

      // Second call should be significantly faster (cached)
      expect(time2).toBeLessThan(time1 / 2);
      expect(results1.length).toBe(results2.length);
    }, 30000);

    it('should cache anime by ID', async () => {
      const start1 = Date.now();
      const anime1 = await provider.fetchAnimeById('1');
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const anime2 = await provider.fetchAnimeById('1');
      const time2 = Date.now() - start2;

      // Second call should be cached
      expect(time2).toBeLessThan(time1 / 2);
      expect(anime1!.id).toBe(anime2!.id);
    }, 30000);
  });
});
