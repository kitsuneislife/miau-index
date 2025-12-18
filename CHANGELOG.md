# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
