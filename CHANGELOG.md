# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-18

### Added
- **Episode & Season Fetching System**: Complete infrastructure for fetching detailed episode metadata from providers
  - `fetchEpisodes()` method in BaseProvider interface (optional)
  - Episode fetching implementations for all providers:
    * AniList: GraphQL with airingSchedule and streamingEpisodes metadata
    * Kitsu: REST API with full episode details (title, synopsis, duration, images)
    * MyAnimeList: Basic episode list from num_episodes count
    * **Jikan**: Paginated episode fetching from unofficial MAL API
  - Episode model with complete metadata: title, synopsis, duration, aired date, images, filler/recap flags
  - AnimeSeason model for organizing episodes by season
  - `getEpisodes(anime)`: Fetches episodes from providers with multi-provider fallback
  - `getAnimeWithEpisodes(id)`: Returns complete anime data with episodes and seasons
  - `organizeIntoSeasons()`: Auto-organizes episodes into seasons (heuristic: 13 eps per season)
  - `associateTorrentsWithEpisodes()`: Auto-links torrents to specific episodes
  - InMemoryEpisodeRepository and InMemorySeasonRepository
  - Integration with NyaaService for automatic episode creation during torrent indexing

- **Jikan Provider**: Free, no-API-key provider for MyAnimeList data
  - Complete anime fetching with all MAL metadata
  - Season metadata and airing information  
  - Episode fetching with pagination support (100 eps per page)
  - Filler and recap episode detection
  - Seasonal anime retrieval
  - Rate limiting: 55 requests/minute (stays under Jikan's 60/min limit)
  - 24-hour caching (matches Jikan's cache duration)
  - Auto-initialized by default (no API key required)
  - Falls back gracefully if official MAL API key is provided

- **Comprehensive Test Suite**:
  - Episode/Season system tests (9 tests)
  - Jikan provider integration tests (coverage for all features)
  - Total: 139 tests (138 passing, 1 running)

- **Examples**:
  - `examples/complete-episode-example.ts`: Complete workflow showing episode fetching, season organization, and torrent association

### Changed
- MiauIndex now initializes Jikan provider by default (free MAL data without API key)
- Episode and Season repositories now passed to NyaaService for integration
- Provider priority updated:
  1. AniList (open source)
  2. Kitsu (open source)
  3. Jikan (unofficial MAL, no key required) - NEW
  4. MyAnimeList (official, requires API key, overrides Jikan if provided)

### Technical Details
- Episode fetching with provider fallback strategy
- Season auto-organization using 13-episode heuristic
- Automatic torrent-episode association via episode number matching
- Complete metadata preservation across all providers
- Type-safe episode and season models
- Async repository operations for episodes and seasons

## [1.0.1] - 2025-12-18

### Changed
- Excluded `.github/copilot-instructions.md` from npm package and git repository
- Fixed integration tests to handle optional fields (`episodeRange`, `lastChecked`)

### Fixed
- All 115 tests now passing (100% success rate)

## [1.0.0] - 2024-12-18

### Added
- Initial release of Miau-Index
- Support for multiple anime data providers:
  - AniList (public API, no key required)
  - Kitsu (public API, no key required)
  - MyAnimeList (optional, requires API key)
- Core features:
  - Anime data fetching and unification
  - Search functionality across providers
  - Seasonal anime retrieval
  - Local repository with search
  - Provider health checking
- **Nyaa Torrent Extension** (optional):
  - Torrent indexing from Nyaa.si
  - Quality detection (480p, 720p, 1080p, 4K)
  - Metadata extraction (codec, language, release group)
  - Smart filtering and search
  - Cache system with configurable TTL
  - Retry logic with exponential backoff
  - Metrics and observability
  - Input sanitization and validation
- Validation and Security:
  - Zod schemas for runtime validation
  - Type guards and helper utilities
  - Custom error classes
  - Input sanitization
- Performance optimizations:
  - In-memory caching with TTL
  - Rate limiting
  - Retry logic with backoff
  - Configurable timeouts
- Developer experience:
  - Full TypeScript support
  - Comprehensive logging system
  - 113+ automated tests (98.3% coverage)
  - Complete API documentation
  - Example files and usage guides

### Technical Details
- Built with TypeScript 5.3
- Runtime validation with Zod 3.22
- HTTP client with Axios
- UUID generation for entities
- Jest for testing
- ESLint + Prettier for code quality

### Dependencies
- `axios`: ^1.6.5
- `uuid`: ^9.0.1
- `zod`: ^3.22.4

### Optional Dependencies
- `@kitsuneislife/nyaa`: ^1.0.0 (for torrent extension)

[1.0.0]: https://github.com/kitsuneislife/miau-index/releases/tag/v1.0.0
