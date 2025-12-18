# Utilities Guide - Miau-Index

This guide covers all utility modules available in Miau-Index.

## Table of Contents

- [Validation](#validation)
- [Cache](#cache)
- [Rate Limiter](#rate-limiter)
- [Helpers](#helpers)
- [Logger](#logger)
- [Errors](#errors)

---

## Validation

Miau-Index provides Zod schemas for runtime validation of all data models.

### Available Schemas

```typescript
import {
  AnimeSchema,
  EpisodeSchema,
  CharacterSchema,
  validateAnime,
  isValidAnime,
} from 'miau-index';

// Validate anime data
try {
  const validatedAnime = validateAnime(rawData);
  console.log('Valid anime:', validatedAnime);
} catch (error) {
  console.error('Validation failed:', error);
}

// Check if data is valid without throwing
if (isValidAnime(data)) {
  console.log('Data is valid');
}
```

### All Validation Functions

- `validateAnime(data)` - Validates and returns typed Anime
- `validateEpisode(data)` - Validates and returns typed Episode
- `validateCharacter(data)` - Validates and returns typed Character
- `isValidAnime(data)` - Returns boolean
- `isValidEpisode(data)` - Returns boolean

---

## Cache

Efficient in-memory caching with TTL support.

### Basic Usage

```typescript
import { CacheService } from 'miau-index';

const cache = new CacheService<string>(3600000); // 1 hour TTL

// Set a value
cache.set('key', 'value');

// Get a value
const value = cache.get('key'); // 'value' or null

// Check if exists
if (cache.has('key')) {
  console.log('Key exists');
}

// Delete a value
cache.delete('key');

// Clear all
cache.clear();
```

### Advanced Features

#### Custom TTL per Entry

```typescript
// Set with custom TTL (30 seconds)
cache.set('key', 'value', { ttl: 30000 });
```

#### Get or Set Pattern

```typescript
const data = await cache.getOrSet(
  'cache-key',
  async () => {
    // This function only runs if cache miss
    const result = await fetchExpensiveData();
    return result;
  },
  { ttl: 60000 } // Optional custom TTL
);
```

#### Cache Statistics

```typescript
const stats = cache.stats();
console.log(`Cache size: ${stats.size}`);
console.log(`Keys: ${stats.keys.join(', ')}`);
```

### Pre-configured Cache Instances

```typescript
import { animeCache, episodeCache, searchCache } from 'miau-index';

// These are ready to use with optimized TTLs
await animeCache.set('anime-123', animeData);
```

---

## Rate Limiter

Protect your application and respect API limits with the rate limiter.

### Basic Usage

```typescript
import { RateLimiter } from 'miau-index';

const limiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60000, // 60 requests per minute
});

// Check before making a request
try {
  await limiter.checkLimit('api-key');
  limiter.recordRequest('api-key');
  // Make API call
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  }
}
```

### Execute with Rate Limiting

```typescript
const result = await limiter.execute('api-key', async () => {
  return await fetchFromAPI();
});
```

### Usage Statistics

```typescript
const usage = limiter.getUsage('api-key');
console.log(`Current: ${usage.current}/${usage.limit}`);
console.log(`Remaining: ${usage.remaining}`);
console.log(`Resets at: ${new Date(usage.resetAt)}`);
```

### Presets

```typescript
import { createRateLimiter } from 'miau-index';

const strictLimiter = createRateLimiter('strict'); // 30/min
const moderateLimiter = createRateLimiter('moderate'); // 60/min
const lenientLimiter = createRateLimiter('lenient'); // 120/min
```

### Advanced Options

```typescript
const limiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: true, // Don't count failed requests
});
```

---

## Helpers

Collection of useful utility functions.

### ID Generation

```typescript
import { generateId } from 'miau-index';

const id = generateId(); // "abc123xyz"
const animeId = generateId('anime'); // "anime-abc123xyz"
```

### Delay

```typescript
import { delay } from 'miau-index';

await delay(1000); // Wait 1 second
```

### Retry with Backoff

```typescript
import { retryWithBackoff } from 'miau-index';

const result = await retryWithBackoff(
  async () => {
    return await unstableAPICall();
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  }
);
```

### String Utilities

```typescript
import { slugify, truncate, stringSimilarity } from 'miau-index';

// Slugify
slugify('Cowboy Bebop: The Movie'); // "cowboy-bebop-the-movie"

// Truncate
truncate('Very long text here', 10); // "Very lo..."

// String similarity (0-1)
const similarity = stringSimilarity('kitten', 'sitting'); // ~0.57
```

### Array Utilities

```typescript
import { groupBy, uniqueBy, chunk } from 'miau-index';

// Group by property
const grouped = groupBy(animes, (anime) => anime.type);

// Remove duplicates
const unique = uniqueBy(animes, (anime) => anime.id);

// Split into chunks
const chunks = chunk([1, 2, 3, 4, 5], 2); // [[1,2], [3,4], [5]]
```

### Object Utilities

```typescript
import { deepClone } from 'miau-index';

const original = { nested: { data: 'value' } };
const cloned = deepClone(original);
// cloned !== original (different references)
```

### Data Formatting

```typescript
import { formatBytes, parseDate, safeJsonParse } from 'miau-index';

// Format bytes
formatBytes(1024); // "1 KB"
formatBytes(1536); // "1.5 KB"

// Parse dates safely
const date = parseDate('2024-01-01'); // Date object or undefined

// Safe JSON parsing
const data = safeJsonParse('{"invalid json', { default: true });
```

---

## Logger

Configurable logging system with multiple levels.

### Basic Usage

```typescript
import { logger, LogLevel } from 'miau-index';

// Set log level
logger.setLevel(LogLevel.DEBUG);

// Log messages
logger.debug('Debug information', { data: 'value' });
logger.info('Information message');
logger.warn('Warning message');
logger.error('Error occurred', error);
```

### Log Levels

- `DEBUG` (0) - Detailed information for debugging
- `INFO` (1) - General informational messages
- `WARN` (2) - Warning messages
- `ERROR` (3) - Error messages

Only messages at or above the current level will be logged.

### Custom Logger

```typescript
import { Logger, LogLevel } from 'miau-index';

const customLogger = new Logger('MyModule', LogLevel.INFO);
customLogger.info('Module initialized');
```

---

## Errors

Custom error classes for better error handling.

### Error Types

```typescript
import {
  MiauIndexError,
  ProviderError,
  ValidationError,
  NotFoundError,
  RateLimitError,
} from 'miau-index';

// Base error
throw new MiauIndexError('Something went wrong');

// Provider-specific error
throw new ProviderError('MyAnimeList', 'API returned 500');

// Validation error
throw new ValidationError('Invalid anime data', 'title');

// Not found error
throw new NotFoundError('Anime', '12345');

// Rate limit error with retry info
throw new RateLimitError(60); // Retry after 60 seconds
```

### Error Handling Pattern

```typescript
try {
  await fetchAnime(id);
} catch (error) {
  if (error instanceof ProviderError) {
    logger.error(`Provider ${error.provider} failed`);
  } else if (error instanceof RateLimitError) {
    logger.warn(`Rate limited, retry after ${error.retryAfter}s`);
    await delay(error.retryAfter * 1000);
  } else if (error instanceof NotFoundError) {
    logger.info('Resource not found');
  } else {
    logger.error('Unknown error', error);
  }
}
```

---

## Repositories

### Episode Repository

```typescript
import { InMemoryEpisodeRepository } from 'miau-index';

const episodeRepo = new InMemoryEpisodeRepository();

// Find episodes by anime ID
const episodes = await episodeRepo.findByAnimeId('anime-123');

// Find specific episode
const ep1 = await episodeRepo.findByNumber('anime-123', 1);

// Save episode
await episodeRepo.save(episode);

// Count episodes
const count = await episodeRepo.count('anime-123');
```

### Season Repository

```typescript
import { InMemorySeasonRepository } from 'miau-index';

const seasonRepo = new InMemorySeasonRepository();

// Find seasons by anime ID
const seasons = await seasonRepo.findByAnimeId('anime-123');

// Find specific season
const season1 = await seasonRepo.findBySeasonNumber('anime-123', 1);

// Save season
await seasonRepo.save(season);
```

---

## Best Practices

### 1. Use Validation

Always validate external data:

```typescript
import { validateAnime, ValidationError } from 'miau-index';

try {
  const anime = validateAnime(externalData);
  await repository.save(anime);
} catch (error) {
  if (error instanceof ValidationError) {
    logger.error('Invalid data received', error.field);
  }
}
```

### 2. Cache Expensive Operations

```typescript
const anime = await animeCache.getOrSet(`anime-${id}`, async () => {
  return await expensiveFetchOperation(id);
});
```

### 3. Respect Rate Limits

```typescript
const limiter = createRateLimiter('moderate');

await limiter.execute('provider-name', async () => {
  return await provider.fetchAnime(id);
});
```

### 4. Handle Errors Gracefully

```typescript
import { retryWithBackoff, ProviderError } from 'miau-index';

try {
  const data = await retryWithBackoff(async () => {
    return await unstableAPI.fetch();
  });
} catch (error) {
  if (error instanceof ProviderError) {
    // Fallback to cached data or alternative source
  }
  throw error;
}
```

### 5. Use Helper Functions

```typescript
import { slugify, truncate, uniqueBy } from 'miau-index';

// Create URL-friendly IDs
const slug = slugify(anime.title.english);

// Prevent duplicate processing
const uniqueAnimes = uniqueBy(results, (a) => a.id);

// Display truncated text
const shortSynopsis = truncate(anime.synopsis, 100);
```

---

## Performance Tips

1. **Cache frequently accessed data**: Use `CacheService` for anime metadata
2. **Batch operations**: Process multiple items together when possible
3. **Rate limiting**: Prevent overloading external APIs
4. **Lazy loading**: Load data only when needed
5. **Validation**: Validate early to fail fast

---

## Testing Utilities

All utilities are fully tested and can be mocked easily:

```typescript
import { CacheService } from 'miau-index';

// In tests
const mockCache = new CacheService<any>(1000);
mockCache.set('test-key', mockData);
```

---

For more examples, see the `/examples` directory or check the API documentation.
