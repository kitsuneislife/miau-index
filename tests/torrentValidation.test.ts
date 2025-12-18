import {
  sanitizeSearchQuery,
  isValidEpisodeNumber,
  isValidEpisodeRange,
  validateTorrent,
  isValidTorrent,
} from '../src/utils/torrentValidation';
import {
  TorrentQuality,
  TorrentLanguage,
  TorrentCodec,
  TorrentReleaseType,
} from '../src/models/Torrent';

describe('Torrent Validation', () => {
  describe('sanitizeSearchQuery', () => {
    it('should trim whitespace', () => {
      expect(sanitizeSearchQuery('  test query  ')).toBe('test query');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeSearchQuery('test<script>alert("xss")</script>')).toBe(
        'testscriptalert(xss)/script'
      );
      expect(sanitizeSearchQuery('test"query')).toBe('testquery');
      expect(sanitizeSearchQuery("test'query")).toBe('testquery');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeSearchQuery('test    multiple     spaces')).toBe(
        'test multiple spaces'
      );
      expect(sanitizeSearchQuery('test\n\nquery')).toBe('test query');
    });

    it('should limit length to 200 characters', () => {
      const longQuery = 'a'.repeat(300);
      expect(sanitizeSearchQuery(longQuery).length).toBe(200);
    });
  });

  describe('isValidEpisodeNumber', () => {
    it('should accept valid episode numbers', () => {
      expect(isValidEpisodeNumber(1)).toBe(true);
      expect(isValidEpisodeNumber(100)).toBe(true);
      expect(isValidEpisodeNumber(999)).toBe(true);
    });

    it('should reject invalid episode numbers', () => {
      expect(isValidEpisodeNumber(0)).toBe(false);
      expect(isValidEpisodeNumber(-1)).toBe(false);
      expect(isValidEpisodeNumber(10001)).toBe(false);
      expect(isValidEpisodeNumber(1.5)).toBe(false);
      expect(isValidEpisodeNumber(NaN)).toBe(false);
    });
  });

  describe('isValidEpisodeRange', () => {
    it('should accept valid episode ranges', () => {
      expect(isValidEpisodeRange(1, 12)).toBe(true);
      expect(isValidEpisodeRange(1, 1)).toBe(true); // Single episode
      expect(isValidEpisodeRange(50, 100)).toBe(true);
    });

    it('should reject invalid episode ranges', () => {
      expect(isValidEpisodeRange(12, 1)).toBe(false); // End before start
      expect(isValidEpisodeRange(0, 10)).toBe(false); // Invalid start
      expect(isValidEpisodeRange(1, 10001)).toBe(false); // Invalid end
      expect(isValidEpisodeRange(1, 1500)).toBe(false); // Too large range
    });
  });

  describe('validateTorrent', () => {
    const validTorrent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nyaaId: '123456',
      title: 'Test Anime - 01 [1080p]',
      category: '1_2',
      magnetLink: 'magnet:?xt=urn:btih:abc123def456789012345678901234567890abcd',
      torrentLink: 'https://nyaa.si/download/123456.torrent',
      infoHash: 'abc123def456789012345678901234567890abcd',
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
        releaseGroup: 'TestGroup',
        isDual: false,
        isMultiSub: false,
        isBatch: false,
        hasHardSubs: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate correct torrent data', () => {
      expect(() => validateTorrent(validTorrent)).not.toThrow();
    });

    it('should reject torrent with invalid UUID', () => {
      const invalid = { ...validTorrent, id: 'not-a-uuid' };
      expect(() => validateTorrent(invalid)).toThrow();
    });

    it('should reject torrent with invalid magnet link', () => {
      const invalid = { ...validTorrent, magnetLink: 'not-a-magnet-link' };
      expect(() => validateTorrent(invalid)).toThrow();
    });

    it('should reject torrent with invalid info hash', () => {
      const invalid = { ...validTorrent, infoHash: 'invalid-hash' };
      expect(() => validateTorrent(invalid)).toThrow();
    });

    it('should reject torrent with negative seeders', () => {
      const invalid = { ...validTorrent, seeders: -1 };
      expect(() => validateTorrent(invalid)).toThrow();
    });
  });

  describe('isValidTorrent', () => {
    const validTorrent = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nyaaId: '123456',
      title: 'Test Anime - 01 [1080p]',
      category: '1_2',
      magnetLink: 'magnet:?xt=urn:btih:abc123def456789012345678901234567890abcd',
      infoHash: 'abc123def456789012345678901234567890abcd',
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
    };

    it('should return true for valid torrent', () => {
      expect(isValidTorrent(validTorrent)).toBe(true);
    });

    it('should return false for invalid torrent', () => {
      expect(isValidTorrent({ ...validTorrent, id: 'invalid' })).toBe(false);
      expect(isValidTorrent({})).toBe(false);
      expect(isValidTorrent(null)).toBe(false);
      expect(isValidTorrent(undefined)).toBe(false);
    });
  });
});
