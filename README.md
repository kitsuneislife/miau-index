# 🐱 Miau-Index

> Um indexador de animes poderoso e robusto em TypeScript que agrega e unifica dados de múltiplas fontes

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Sobre

Miau-Index é uma biblioteca TypeScript projetada para agregar, unificar e normalizar dados de anime de múltiplas fontes externas como MyAnimeList, AniList, Kitsu e outras. O projeto oferece uma arquitetura robusta e escalável para gerenciar informações completas sobre animes, incluindo:

- 📺 Informações básicas (título, tipo, status, episódios)
- ⭐ Avaliações e rankings de múltiplas fontes
- 📝 Sinopses e descrições
- 🎭 Gêneros, temas e demografias
- 🎬 Temporadas e episódios detalhados
- 👥 Personagens, dubladores e equipe
- 🏢 Estúdios e produtoras
- 🔗 Relações entre animes (sequels, prequels, etc.)

## ✨ Características

### 🌟 Prioridade: Fontes Abertas e Livres
- **Zero API Keys Necessárias**: Funciona perfeitamente sem nenhuma configuração
- **AniList**: API GraphQL pública e totalmente gratuita
- **Kitsu**: API JSON:API pública e totalmente gratuita
- **MyAnimeList**: OPCIONAL - apenas se você tiver/quiser usar API key
- **Preferência Automática**: Prioriza fontes abertas por padrão

### Core Features
- **Unificação de Dados**: Combina informações de múltiplas APIs para criar um registro completo e preciso
- **Type-Safe**: Totalmente tipado com TypeScript para máxima segurança
- **Extensível**: Arquitetura modular permite adicionar novos provedores facilmente

### Validação e Segurança
- **Schemas Zod**: Validação runtime robusta para todos os modelos de dados
- **Type Guards**: Funções auxiliares para verificação de tipos
- **Error Handling**: Classes de erro customizadas para melhor tratamento

### Performance
- **Cache Service**: Sistema de cache em memória com TTL configurável
- **Rate Limiting**: Controle inteligente de taxa de requisições
- **Retry Logic**: Retry automático com backoff exponencial

### Developer Experience  
- **Logging**: Sistema de logs configurável com múltiplos níveis
- **Helper Utilities**: Mais de 15 funções auxiliares prontas para uso
- **Comprehensive Tests**: 62+ testes automatizados
- **Full Documentation**: Documentação completa de API e guias

## 🚀 Instalação

```bash
npm install miau-index
```

## 📖 Uso Básico

```typescript
import { MiauIndex, DataSource } from '@kitsuneislife/miau-index';

// Inicializar o indexador
// Funciona SEM API KEYS - usa fontes abertas (AniList, Kitsu)
const miauIndex = new MiauIndex({
  // Todas as configurações são opcionais!
  malApiKey: 'your-mal-api-key', // OPCIONAL: apenas se tiver API key do MAL
  enabledProviders: {
    myAnimeList: true, // Ignorado se não tiver API key
    aniList: true,     // ✓ Fonte aberta - SEM API key necessária
    kitsu: true,       // ✓ Fonte aberta - SEM API key necessária
  },
  preferOpenSources: true, // Prioriza fontes abertas (padrão: true)
  enableLogging: true,
});

// Buscar anime específico do AniList
const anime = await miauIndex.fetchAnime([
  { source: DataSource.ANILIST, id: '5114' }
]);

console.log(anime.title.romaji); // "Fullmetal Alchemist: Brotherhood"
console.log(anime.ratings); // Avaliações com score e votos

// Buscar animes por título (busca em todos os providers)
const results = await miauIndex.searchAnime('Cowboy Bebop', 10);

// Obter animes da temporada
const winterAnime = await miauIndex.getSeasonalAnime(2024, 'winter');

// Buscar no repositório local
const localResults = await miauIndex.searchLocal('Naruto', 5);

// Verificar saúde dos providers
const health = await miauIndex.checkProviders();
console.log(health); // { ANILIST: true, MYANIMELIST: true, ... }

// Estatísticas do repositório
const stats = await miauIndex.getStats();
console.log(stats.totalAnime); // Total de animes armazenados
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
