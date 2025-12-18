# API Documentation - Miau-Index

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Classes](#core-classes)
- [Models](#models)
- [Providers](#providers)
- [Services](#services)
- [Repositories](#repositories)
- [Types](#types)

## Installation

```bash
npm install miau-index
```

## Quick Start

```typescript
import { MiauIndex, DataSource } from 'miau-index';

const miauIndex = new MiauIndex();

// Fetch and unify anime from multiple sources
const anime = await miauIndex.fetchAnime([
  { source: DataSource.MYANIMELIST, id: '5114' },
  { source: DataSource.ANILIST, id: '5114' }
]);
```

## Core Classes

### MiauIndex

Main entry point for the library.

#### Constructor

```typescript
new MiauIndex()
```

Creates a new instance of MiauIndex with default configuration.

#### Methods

##### `fetchAnime(externalIds: ExternalId[]): Promise<Anime>`

Fetches and unifies anime data from multiple sources.

**Parameters:**
- `externalIds`: Array of external IDs from different sources

**Returns:** Unified `Anime` object

**Example:**
```typescript
const anime = await miauIndex.fetchAnime([
  { source: DataSource.MYANIMELIST, id: '1' },
  { source: DataSource.ANILIST, id: '1' }
]);
```

##### `searchAnime(query: string, limit?: number): Promise<Anime[]>`

Searches for anime across all registered providers.

**Parameters:**
- `query`: Search term
- `limit`: Maximum number of results (default: 10)

**Returns:** Array of unified `Anime` objects

**Example:**
```typescript
const results = await miauIndex.searchAnime('Cowboy Bebop', 5);
```

##### `getAnimeById(id: string): Promise<Anime | null>`

Retrieves anime from local repository by internal ID.

**Parameters:**
- `id`: Internal anime ID

**Returns:** `Anime` object or `null` if not found

##### `searchLocal(query: string, limit?: number): Promise<Anime[]>`

Searches for anime in the local repository only.

**Parameters:**
- `query`: Search term
- `limit`: Maximum number of results (default: 10)

**Returns:** Array of `Anime` objects

## Models

### Anime

Main anime model with unified data from multiple sources.

```typescript
interface Anime {
  id: string;
  title: Title;
  type: AnimeType;
  status: AnimeStatus;
  episodes?: number;
  duration?: number;
  season?: Season;
  year?: number;
  synopsis?: string;
  background?: string;
  images: Image;
  trailer?: {
    url?: string;
    embedUrl?: string;
  };
  aired: DateRange;
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
  };
  ratings: Rating[];
  ageRating?: AgeRating;
  genres: string[];
  themes: string[];
  demographics?: string[];
  studios: string[];
  producers: string[];
  licensors: string[];
  relations?: AnimeRelation[];
  adaptations?: Adaptation[];
  externalIds: ExternalId[];
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
}
```

### Episode

Represents an individual anime episode.

```typescript
interface Episode {
  id: string;
  animeId: string;
  number: number;
  title?: string;
  titleJapanese?: string;
  titleRomaji?: string;
  synopsis?: string;
  duration?: number;
  images?: Image;
  aired?: Date;
  filler?: boolean;
  recap?: boolean;
  externalIds: ExternalId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### AnimeSeason

Represents a season or cour of an anime.

```typescript
interface AnimeSeason {
  id: string;
  animeId: string;
  seasonNumber: number;
  title?: string;
  episodeCount?: number;
  episodes?: Episode[];
  aired?: DateRange;
  externalIds: ExternalId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Character

Represents an anime character.

```typescript
interface Character {
  id: string;
  name: {
    full?: string;
    native?: string;
    alternative?: string[];
  };
  description?: string;
  image?: string;
  role?: CharacterRole;
  voiceActors?: VoiceActor[];
  externalIds: ExternalId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Studio

Represents an animation studio.

```typescript
interface Studio {
  id: string;
  name: string;
  favorites?: number;
  externalIds: ExternalId[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Providers

### IAnimeProvider

Interface that all providers must implement.

```typescript
interface IAnimeProvider {
  getSource(): DataSource;
  fetchAnimeById(externalId: string): Promise<Anime | null>;
  searchAnime(query: string, limit?: number): Promise<Anime[]>;
  getSeasonalAnime(year: number, season: string): Promise<Anime[]>;
  isAvailable(): Promise<boolean>;
}
```

### Available Providers

- **MyAnimeListProvider**: MyAnimeList integration
- **AniListProvider**: AniList GraphQL API integration
- **KitsuProvider**: Kitsu API integration

### Creating a Custom Provider

```typescript
import { BaseAnimeProvider } from 'miau-index';

class CustomProvider extends BaseAnimeProvider {
  constructor() {
    super('https://api.custom.com');
  }

  getSource(): DataSource {
    return DataSource.CUSTOM;
  }

  async fetchAnimeById(externalId: string): Promise<Anime | null> {
    // Implementation
  }

  async searchAnime(query: string, limit = 10): Promise<Anime[]> {
    // Implementation
  }

  async getSeasonalAnime(year: number, season: string): Promise<Anime[]> {
    // Implementation
  }
}
```

## Services

### AnimeUnificationService

Service responsible for unifying anime data from multiple sources.

#### Methods

##### `registerProvider(provider: IAnimeProvider): void`

Registers a new data provider.

##### `fetchAndUnify(externalIds: ExternalId[], options?: UnificationOptions): Promise<Anime>`

Fetches and unifies anime data from multiple sources.

**UnificationOptions:**
```typescript
interface UnificationOptions {
  preferredSources?: DataSource[];
  minSourcesForConsensus?: number;
  mergeArrays?: boolean;
}
```

##### `searchAndUnify(query: string, limit?: number): Promise<Anime[]>`

Searches across all providers and unifies results.

## Repositories

### IAnimeRepository

Interface for anime data persistence.

```typescript
interface IAnimeRepository {
  findById(id: string): Promise<Anime | null>;
  findByExternalId(source: string, externalId: string): Promise<Anime | null>;
  searchByTitle(title: string, limit?: number): Promise<Anime[]>;
  save(anime: Anime): Promise<Anime>;
  saveMany(animes: Anime[]): Promise<Anime[]>;
  delete(id: string): Promise<boolean>;
  findAll(page: number, limit: number): Promise<Anime[]>;
  count(): Promise<number>;
}
```

### InMemoryAnimeRepository

Default in-memory implementation of `IAnimeRepository`.

## Types

### Enums

#### AnimeType
```typescript
enum AnimeType {
  TV = 'TV',
  MOVIE = 'MOVIE',
  OVA = 'OVA',
  ONA = 'ONA',
  SPECIAL = 'SPECIAL',
  MUSIC = 'MUSIC'
}
```

#### AnimeStatus
```typescript
enum AnimeStatus {
  AIRING = 'AIRING',
  FINISHED = 'FINISHED',
  NOT_YET_AIRED = 'NOT_YET_AIRED',
  CANCELLED = 'CANCELLED'
}
```

#### Season
```typescript
enum Season {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL'
}
```

#### DataSource
```typescript
enum DataSource {
  MYANIMELIST = 'MYANIMELIST',
  ANILIST = 'ANILIST',
  KITSU = 'KITSU',
  ANIDB = 'ANIDB',
  TMDB = 'TMDB'
}
```

#### AgeRating
```typescript
enum AgeRating {
  G = 'G',           // All Ages
  PG = 'PG',         // Children
  PG_13 = 'PG_13',   // Teens 13+
  R = 'R',           // 17+
  R_PLUS = 'R_PLUS', // Mild Nudity
  RX = 'RX'          // Hentai
}
```

### Common Types

#### Title
```typescript
interface Title {
  romaji?: string;
  english?: string;
  native?: string;
  synonyms?: string[];
}
```

#### Image
```typescript
interface Image {
  small?: string;
  medium?: string;
  large?: string;
  original?: string;
}
```

#### Rating
```typescript
interface Rating {
  source: DataSource;
  score?: number;
  votes?: number;
  rank?: number;
  popularity?: number;
}
```

#### ExternalId
```typescript
interface ExternalId {
  source: DataSource;
  id: string;
}
```

#### DateRange
```typescript
interface DateRange {
  start?: Date;
  end?: Date;
}
```

## Error Handling

The library provides custom error classes:

```typescript
import { 
  MiauIndexError, 
  ProviderError, 
  ValidationError, 
  NotFoundError, 
  RateLimitError 
} from 'miau-index';

try {
  await miauIndex.fetchAnime(externalIds);
} catch (error) {
  if (error instanceof ProviderError) {
    console.error(`Provider ${error.provider} failed`);
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limit exceeded, retry after ${error.retryAfter}s`);
  }
}
```

## Configuration

Configuration is loaded from environment variables:

```env
# API Keys
MAL_CLIENT_ID=your_client_id
ANILIST_CLIENT_ID=your_client_id
KITSU_API_KEY=your_api_key

# Application
NODE_ENV=development
LOG_LEVEL=info

# Repository
REPOSITORY_TYPE=memory

# Cache
CACHE_ENABLED=true
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_RPM=60
```

## Examples

### Basic Usage

```typescript
import { MiauIndex, DataSource } from 'miau-index';

const miauIndex = new MiauIndex();

// Fetch anime
const anime = await miauIndex.fetchAnime([
  { source: DataSource.MYANIMELIST, id: '1' }
]);

console.log(anime.title.romaji);
console.log(anime.genres);
console.log(anime.ratings);
```

### Search

```typescript
const results = await miauIndex.searchAnime('One Piece', 10);

for (const anime of results) {
  console.log(`${anime.title.romaji} - ${anime.type}`);
}
```

### Custom Provider

```typescript
import { BaseAnimeProvider, DataSource } from 'miau-index';

class MyCustomProvider extends BaseAnimeProvider {
  // Implementation
}

const customProvider = new MyCustomProvider();
// Register with MiauIndex if needed
```

## Support

For issues and questions, please open an issue on GitHub.
