import { JikanProvider } from '../src/providers/JikanProvider';
import { DataSource } from '../src/types/common';

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

  // Integration tests are skipped by default to avoid slow API calls
  // Run with: npm test -- JikanProvider --testNamePattern="should fetch"
  describe.skip('Integration Tests (slow)', () => {
    it('should fetch anime by MAL ID', async () => {
      const anime = await provider.fetchAnimeById('1');
      expect(anime).toBeDefined();
      expect(anime!.title.romaji).toBeDefined();
    }, 15000);

    it('should handle non-existent anime', async () => {
      const anime = await provider.fetchAnimeById('999999999');
      expect(anime).toBeNull();
    }, 15000);

    it('should search anime', async () => {
      const results = await provider.searchAnime('Steins Gate', 5);
      expect(Array.isArray(results)).toBe(true);
    }, 15000);

    it('should fetch episodes', async () => {
      const episodes = await provider.fetchEpisodes('test', '1');
      expect(Array.isArray(episodes)).toBe(true);
    }, 30000);
  });
});
