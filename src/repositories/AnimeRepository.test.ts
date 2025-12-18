import { InMemoryAnimeRepository } from '../repositories/AnimeRepository';
import { Anime } from '../models/Anime';
import { AnimeType, AnimeStatus, DataSource } from '../types/common';

describe('AnimeRepository', () => {
  let repository: InMemoryAnimeRepository;

  beforeEach(() => {
    repository = new InMemoryAnimeRepository();
  });

  describe('save and findById', () => {
    it('should save and retrieve anime by id', async () => {
      const anime: Anime = {
        id: 'test-1',
        title: {
          romaji: 'Test Anime',
          english: 'Test Anime',
        },
        type: AnimeType.TV,
        status: AnimeStatus.FINISHED,
        images: {},
        ratings: [],
        genres: ['Action'],
        themes: [],
        studios: [],
        producers: [],
        licensors: [],
        externalIds: [{ source: DataSource.MYANIMELIST, id: '1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
        aired: {},
      };

      await repository.save(anime);
      const retrieved = await repository.findById('test-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-1');
      expect(retrieved?.title.romaji).toBe('Test Anime');
    });

    it('should return null for non-existent id', async () => {
      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('searchByTitle', () => {
    beforeEach(async () => {
      const animes: Anime[] = [
        {
          id: '1',
          title: { romaji: 'Cowboy Bebop' },
          type: AnimeType.TV,
          status: AnimeStatus.FINISHED,
          images: {},
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
          aired: {},
        },
        {
          id: '2',
          title: { english: 'Fullmetal Alchemist' },
          type: AnimeType.TV,
          status: AnimeStatus.FINISHED,
          images: {},
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
          aired: {},
        },
      ];

      await repository.saveMany(animes);
    });

    it('should find anime by romaji title', async () => {
      const results = await repository.searchByTitle('Cowboy');
      expect(results).toHaveLength(1);
      expect(results[0].title.romaji).toBe('Cowboy Bebop');
    });

    it('should find anime by english title', async () => {
      const results = await repository.searchByTitle('Fullmetal');
      expect(results).toHaveLength(1);
      expect(results[0].title.english).toBe('Fullmetal Alchemist');
    });

    it('should return empty array for no matches', async () => {
      const results = await repository.searchByTitle('NonExistent');
      expect(results).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const results = await repository.searchByTitle('a', 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('findByExternalId', () => {
    it('should find anime by external id', async () => {
      const anime: Anime = {
        id: 'test-1',
        title: { romaji: 'Test' },
        type: AnimeType.TV,
        status: AnimeStatus.FINISHED,
        images: {},
        ratings: [],
        genres: [],
        themes: [],
        studios: [],
        producers: [],
        licensors: [],
        externalIds: [{ source: DataSource.MYANIMELIST, id: '123' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
        aired: {},
      };

      await repository.save(anime);
      const result = await repository.findByExternalId('MYANIMELIST', '123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-1');
    });
  });

  describe('count and findAll', () => {
    beforeEach(async () => {
      const animes: Anime[] = Array.from({ length: 5 }, (_, i) => ({
        id: `anime-${i}`,
        title: { romaji: `Anime ${i}` },
        type: AnimeType.TV,
        status: AnimeStatus.FINISHED,
        images: {},
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
        aired: {},
      }));

      await repository.saveMany(animes);
    });

    it('should count total anime', async () => {
      const count = await repository.count();
      expect(count).toBe(5);
    });

    it('should paginate results', async () => {
      const page1 = await repository.findAll(0, 2);
      const page2 = await repository.findAll(1, 2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('delete', () => {
    it('should delete anime by id', async () => {
      const anime: Anime = {
        id: 'test-1',
        title: { romaji: 'Test' },
        type: AnimeType.TV,
        status: AnimeStatus.FINISHED,
        images: {},
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
        aired: {},
      };

      await repository.save(anime);
      const deleted = await repository.delete('test-1');
      const result = await repository.findById('test-1');

      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });

    it('should return false for non-existent id', async () => {
      const deleted = await repository.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });
});
