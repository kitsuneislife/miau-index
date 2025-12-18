/**
 * Configuration interface for the @kitsuneislife/miau-index application
 */
export interface Config {
  // API Keys
  myAnimeList?: {
    clientId?: string;
    clientSecret?: string;
  };
  aniList?: {
    clientId?: string;
    clientSecret?: string;
  };
  kitsu?: {
    apiKey?: string;
  };

  // Application Settings
  app: {
    env: 'development' | 'production' | 'test';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };

  // Repository Settings
  repository: {
    type: 'memory' | 'file' | 'database';
    connectionString?: string;
  };

  // Cache Settings
  cache: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
  };

  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
  };
}

/**
 * Default configuration
 */
export const defaultConfig: Config = {
  app: {
    env: 'development',
    logLevel: 'info',
  },
  repository: {
    type: 'memory',
  },
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
  },
  rateLimit: {
    enabled: true,
    requestsPerMinute: 60,
  },
};

/**
 * Load configuration from environment variables
 */
export function loadConfig(): Config {
  return {
    myAnimeList: {
      clientId: process.env.MAL_CLIENT_ID,
      clientSecret: process.env.MAL_CLIENT_SECRET,
    },
    aniList: {
      clientId: process.env.ANILIST_CLIENT_ID,
      clientSecret: process.env.ANILIST_CLIENT_SECRET,
    },
    kitsu: {
      apiKey: process.env.KITSU_API_KEY,
    },
    app: {
      env: (process.env.NODE_ENV as Config['app']['env']) || defaultConfig.app.env,
      logLevel: (process.env.LOG_LEVEL as Config['app']['logLevel']) || defaultConfig.app.logLevel,
    },
    repository: {
      type:
        (process.env.REPOSITORY_TYPE as Config['repository']['type']) ||
        defaultConfig.repository.type,
      connectionString: process.env.DATABASE_URL,
    },
    cache: {
      enabled: process.env.CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.CACHE_TTL || String(defaultConfig.cache.ttl)),
    },
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      requestsPerMinute: parseInt(
        process.env.RATE_LIMIT_RPM || String(defaultConfig.rateLimit.requestsPerMinute)
      ),
    },
  };
}
