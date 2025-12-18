# 🐱 Miau-Index

> A powerful TypeScript anime indexer that aggregates and unifies anime data from multiple sources

[![npm version](https://img.shields.io/npm/v/@kitsuneislife/miau-index.svg)](https://www.npmjs.com/package/@kitsuneislife/miau-index)
[![npm downloads](https://img.shields.io/npm/dm/@kitsuneislife/miau-index.svg)](https://www.npmjs.com/package/@kitsuneislife/miau-index)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-113%2F115%20passing-brightgreen.svg)](https://github.com/kitsuneislife/miau-index)

## 📋 About

Miau-Index is a powerful TypeScript library designed to aggregate, unify, and normalize anime data from multiple external sources like MyAnimeList, AniList, Kitsu, and more. The project offers a robust and scalable architecture to manage complete anime information, including:

- 📺 Basic information (title, type, status, episodes)
- ⭐ Ratings and rankings from multiple sources
- 📝 Synopses and descriptions
- 🎭 Genres, themes, and demographics
- 🎬 Detailed seasons and episodes
- 👥 Characters, voice actors, and staff
- 🏢 Studios and producers
- 🔗 Anime relations (sequels, prequels, etc.)
- 🧲 **NEW: Torrent indexing from Nyaa.si** (optional extension)

## ✨ Features

### 🌟 Priority: Open and Free Sources
- **Zero API Keys Required**: Works perfectly without any configuration
- **AniList**: Public and completely free GraphQL API
- **Kitsu**: Public and completely free JSON:API
- **MyAnimeList**: OPTIONAL - only if you have/want to use an API key
- **Automatic Preference**: Prioritizes open sources by default

### Core Features
- **Data Unification**: Combines information from multiple APIs to create a complete and accurate record
- **Type-Safe**: Fully typed with TypeScript for maximum safety
- **Extensible**: Modular architecture allows easy addition of new providers
- **🆕 Nyaa Extension**: Optional torrent indexing with quality detection, metadata extraction, and smart filtering

### Validation and Security
- **Zod Schemas**: Robust runtime validation for all data models
- **Type Guards**: Helper functions for type checking
- **Error Handling**: Custom error classes for better error management
- **Input Sanitization**: Protection against injection attacks

### Performance
- **Cache Service**: In-memory caching system with configurable TTL
- **Rate Limiting**: Intelligent request rate control
- **Retry Logic**: Automatic retry with exponential backoff
- **Timeout Configuration**: Configurable request timeouts

### Developer Experience  
- **Logging**: Configurable logging system with multiple levels
- **Helper Utilities**: 15+ ready-to-use helper functions
- **Comprehensive Tests**: 113+ automated tests (98.3% passing)
- **Full Documentation**: Complete API documentation and guides
- **Metrics & Observability**: Built-in metrics tracking for monitoring

## 🚀 Installation

```bash
npm install @kitsuneislife/miau-index
```

### Optional: Nyaa Torrent Extension

```bash
npm install @kitsuneislife/miau-index @kitsuneislife/nyaa
```

## 📖 Basic Usage

```typescript
import { MiauIndex, DataSource } from '@kitsuneislife/miau-index';

// Initialize the indexer
// Works WITHOUT API KEYS - uses open sources (AniList, Kitsu)
const miauIndex = new MiauIndex({
  // All settings are optional!
  malApiKey: 'your-mal-api-key', // OPTIONAL: only if you have MAL API key
  enabledProviders: {
    myAnimeList: true, // Ignored if no API key
    aniList: true,     // ✓ Open source - NO API key needed
    kitsu: true,       // ✓ Open source - NO API key needed
  },
  preferOpenSources: true, // Prioritize open sources (default: true)
  enableLogging: true,
});

// Fetch specific anime from AniList
const anime = await miauIndex.fetchAnime([
  { source: DataSource.ANILIST, id: '5114' }
]);

console.log(anime.title.romaji); // "Fullmetal Alchemist: Brotherhood"
console.log(anime.ratings); // Ratings with score and votes

// Search anime by title (searches all providers)
const results = await miauIndex.searchAnime('Cowboy Bebop', 10);

// Get seasonal anime
const winterAnime = await miauIndex.getSeasonalAnime(2024, 'winter');

// Search in local repository
const localResults = await miauIndex.searchLocal('Naruto', 5);

// Check provider health
const health = await miauIndex.checkProviders();
console.log(health); // { ANILIST: true, MYANIMELIST: true, ... }

// Repository statistics
const stats = await miauIndex.getStats();
console.log(stats.totalAnime); // Total stored anime
```

### 🆕 Nyaa Torrent Extension

```typescript
import { MiauIndex } from '@kitsuneislife/miau-index';
import { TorrentQuality } from '@kitsuneislife/miau-index';

// Enable Nyaa extension
const miauIndex = new MiauIndex({
  enableNyaa: true, // Enable torrent indexing
  nyaaOptions: {
    autoIndex: true,
    minSeeders: 5,
    preferredQuality: TorrentQuality.FULL_HD_1080p,
    enableCache: true,
    cacheTTL: 3600000, // 1 hour
    timeout: 30000,
    maxRetries: 3,
  },
});

// Index torrents for an anime
const torrents = await miauIndex.indexTorrents(anime);
console.log(`Found ${torrents.length} torrents`);

// Get best torrent for an episode
const bestTorrent = await miauIndex.getBestTorrent(anime, 1);
console.log(bestTorrent.magnetLink);

// Search with filters
const filtered = await miauIndex.searchTorrents(anime, {
  quality: TorrentQuality.FULL_HD_1080p,
  minSeeders: 10,
});

// Get metrics
const metrics = miauIndex.getNyaaMetrics();
console.log(`Cache hit rate: ${metrics.cacheHitRate.toFixed(2)}%`);
```

## 🌸 Extensão Nyaa (OPCIONAL)

Miau-Index inclui uma extensão **TOTALMENTE OPCIONAL** para indexar torrents de anime do Nyaa.si. Esta extensão usa o pacote [`@kitsuneislife/nyaa`](https://github.com/kitsuneislife/nyaa) para buscar e associar torrents aos animes.

### Instalação da Extensão

```bash
npm install @kitsuneislife/nyaa
```

### Características da Extensão Nyaa

- 🔍 **Indexação Automática**: Busca torrents para animes e episódios
- 📊 **Metadata Completa**: Extrai qualidade, codec, idiomas, release group
- 🎯 **Associação Inteligente**: Liga torrents aos episódios corretos
- 🌐 **Multi-Idioma**: Suporte para áudio e legendas em vários idiomas
- 📦 **Batches**: Detecta e indexa torrents com múltiplos episódios
- ⚡ **Filtros Avançados**: Busca por qualidade, idioma, seeders, etc.
- 📈 **Estatísticas**: Analytics detalhados sobre torrents

### Uso da Extensão Nyaa

```typescript
import { MiauIndex, DataSource } from '@kitsuneislife/miau-index';
import { TorrentQuality, TorrentLanguage } from '@kitsuneislife/miau-index';

// Habilitar extensão Nyaa
const miauIndex = new MiauIndex({
  enableNyaa: true, // ✓ ATIVA a extensão de torrents
  nyaaOptions: {
    autoIndex: true,
    minSeeders: 5,
    trustedOnly: false,
    preferredQuality: TorrentQuality.FULL_HD_1080p,
    preferredLanguages: [TorrentLanguage.JAPANESE, TorrentLanguage.ENGLISH],
  },
});

// Verificar se está habilitada
console.log(miauIndex.isNyaaEnabled); // true

// Buscar anime
const anime = await miauIndex.fetchAnime([
  { source: DataSource.ANILIST, id: '21' } // One Piece
]);

// 1. Indexar todos os torrents do anime
const torrents = await miauIndex.indexTorrents(anime);
console.log(`${torrents.length} torrents encontrados`);

// 2. Indexar torrents de episódio específico
const ep1Torrents = await miauIndex.indexEpisodeTorrents(anime, 1);

// 3. Buscar torrents com filtros
const filtered = await miauIndex.searchTorrents(anime, {
  quality: TorrentQuality.FULL_HD_1080p,
  subtitleLanguage: TorrentLanguage.ENGLISH,
  minSeeders: 10,
  episodeNumber: 1,
});

// 4. Obter melhor torrent para episódio
const best = await miauIndex.getBestTorrent(anime, 1);
console.log(best?.magnetLink);
console.log(best?.metadata.quality);
console.log(best?.metadata.releaseGroup);

// 5. Estatísticas de torrents
const stats = await miauIndex.getTorrentStats(anime.id);
console.log(`Total: ${stats.totalTorrents}`);
console.log(`Média de seeders: ${stats.averageSeeders}`);
console.log(`Por qualidade:`, stats.byQuality);
console.log(`Por idioma:`, stats.byLanguage);

// 6. Atualizar informações do torrent (seeders/leechers)
const updated = await miauIndex.refreshTorrent(best.id);
```

### Tipos de Torrent

#### Qualidades
- `SD_480p`: 480p
- `HD_720p`: 720p
- `FULL_HD_1080p`: 1080p (padrão)
- `UHD_2160p` / `UHD_4K`: 4K/2160p
- `RAW`: Raw (sem legendas)

#### Idiomas
- `JAPANESE`: Japonês
- `ENGLISH`: Inglês
- `PORTUGUESE_BR`: Português (BR)
- `SPANISH`: Espanhol
- `FRENCH`: Francês
- `GERMAN`: Alemão
- `ITALIAN`: Italiano
- `RUSSIAN`: Russo
- `CHINESE`: Chinês
- `KOREAN`: Coreano
- `MULTI`: Múltiplos idiomas

#### Tipos de Release
- `EPISODE`: Episódio individual
- `BATCH`: Lote de episódios
- `SEASON`: Temporada completa
- `COMPLETE`: Série completa
- `MOVIE`: Filme
- `OVA`: OVA
- `SPECIAL`: Especial

### Metadata Extraída

Cada torrent inclui metadata completa extraída do título:
- ✅ Qualidade (480p, 720p, 1080p, 4K)
- ✅ Codec (H.264, HEVC/H.265, AV1)
- ✅ Idiomas de áudio (Dual Audio detectado)
- ✅ Idiomas de legendas (Multi-sub detectado)
- ✅ Release group
- ✅ Tipo de release (episódio, batch, etc.)
- ✅ Range de episódios (para batches)

### Exemplo Completo

Veja o arquivo [examples/nyaa-extension.ts](examples/nyaa-extension.ts) para exemplos completos de uso.

```bash
npx ts-node examples/nyaa-extension.ts
```

## ⚙️ Configuração

Crie um arquivo `.env` baseado no `.env.example`:

```env
# MyAnimeList API
MAL_CLIENT_ID=seu_client_id
MAL_CLIENT_SECRET=seu_client_secret

# AniList API
ANILIST_CLIENT_ID=seu_client_id
ANILIST_CLIENT_SECRET=seu_client_secret

# Kitsu API
KITSU_API_KEY=sua_api_key

# Configurações da aplicação
NODE_ENV=development
LOG_LEVEL=info
REPOSITORY_TYPE=memory
CACHE_ENABLED=true
CACHE_TTL=3600
RATE_LIMIT_ENABLED=true
RATE_LIMIT_RPM=60
```

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
src/
├── config/           # Configurações da aplicação
├── models/          # Modelos de dados (Anime, Episode, People)
├── providers/       # Provedores de dados externos (MAL, AniList, Kitsu)
├── repositories/    # Camada de persistência
├── services/        # Serviços de lógica de negócio
├── types/           # Definições de tipos TypeScript
├── utils/           # Utilitários (logger, errors)
├── example.ts       # Exemplo de uso
└── index.ts         # Ponto de entrada principal
```

### Componentes Principais

#### Modelos

- **Anime**: Modelo principal com todas as informações unificadas
- **Episode**: Informações de episódios individuais
- **AnimeSeason**: Agrupamento de episódios por temporada
- **Character**: Personagens e dubladores
- **Studio**: Informações de estúdios

#### Provedores

- **BaseAnimeProvider**: Classe abstrata base para todos os provedores
- **MyAnimeListProvider**: Integração completa com MyAnimeList
- **AniListProvider**: Integração completa com AniList (GraphQL)
- **KitsuProvider**: Integração completa com Kitsu

#### Serviços

- **AnimeUnificationService**: Serviço principal que unifica dados de múltiplas fontes usando estratégias de consenso e prioridade

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Executar exemplo
npm run dev

# Executar aplicação compilada
npm start

# Testes
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Formatação
npm run format
npm run format:check
```

### Adicionar um Novo Provedor

1. Crie uma nova classe que estende `BaseAnimeProvider`
2. Implemente os métodos obrigatórios:
   - `getSource()`: Retorna o `DataSource`
   - `fetchAnimeById()`: Busca anime por ID externo
   - `searchAnime()`: Busca animes por query
   - `getSeasonalAnime()`: Busca animes de uma temporada

```typescript
import { BaseAnimeProvider } from './BaseProvider';
import { DataSource } from '../types/common';

export class NovoProvider extends BaseAnimeProvider {
  constructor() {
    super('https://api.exemplo.com');
  }

  getSource(): DataSource {
    return DataSource.NOVO_PROVIDER;
  }

  async fetchAnimeById(externalId: string): Promise<Anime | null> {
    // Implementação
  }

  // ... outros métodos
}
```

3. Registre o provedor no `MiauIndex`:

```typescript
const novoProvider = new NovoProvider();
miauIndex.registerProvider(novoProvider);
```

## 📊 Tipos de Dados

### AnimeType
- TV
- MOVIE
- OVA
- ONA
- SPECIAL
- MUSIC

### AnimeStatus
- AIRING
- FINISHED
- NOT_YET_AIRED
- CANCELLED

### DataSource
- MYANIMELIST
- ANILIST
- KITSU
- ANIDB
- TMDB

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Quick Start for Contributors

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/miau-index.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/my-feature`
5. Make your changes and add tests
6. Run tests: `npm test`
7. Commit: `git commit -m "feat: add my feature"`
8. Push: `git push origin feature/my-feature`
9. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [MyAnimeList](https://myanimelist.net/) for anime data
- [AniList](https://anilist.co/) for GraphQL API
- [Kitsu](https://kitsu.io/) for JSON:API
- [Nyaa.si](https://nyaa.si/) for torrent indexing

## 📮 Support

- 📧 Email: support@kitsuneislife.dev
- 🐛 Issues: [GitHub Issues](https://github.com/kitsuneislife/miau-index/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/kitsuneislife/miau-index/discussions)

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/@kitsuneislife/miau-index)
- [GitHub Repository](https://github.com/kitsuneislife/miau-index)
- [Documentation](https://github.com/kitsuneislife/miau-index/tree/main/docs)
- [Changelog](CHANGELOG.md)

---

Made with ❤️ by [kitsuneislife](https://github.com/kitsuneislife)

## 🧪 Testes

```bash
npm test
```

Os testes estão configurados com Jest e incluem:
- Testes unitários para modelos
- Testes de integração para serviços
- Testes de providers

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- MyAnimeList
- AniList
- Kitsu
- Comunidade de anime

## 🔮 Roadmap

- [ ] Implementação completa dos provedores MAL, AniList e Kitsu
- [ ] Suporte a persistência em banco de dados (PostgreSQL, MongoDB)
- [ ] API REST para acesso aos dados
- [ ] Sistema de cache distribuído (Redis)
- [ ] Webhooks para atualizações em tempo real
- [ ] Interface web para visualização
- [ ] Suporte a mais fontes de dados (AniDB, TMDB)
- [ ] Sistema de recommendations
- [ ] Análise de sentimento em reviews
- [ ] GraphQL API

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no GitHub.

---

Feito com ❤️ e TypeScript
