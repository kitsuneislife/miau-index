# Extensão Nyaa - Miau-Index

## 📦 O que foi implementado

Adicionei uma extensão **TOTALMENTE OPCIONAL** ao Miau-Index para indexar torrents de anime do Nyaa.si usando o pacote `@kitsuneislife/nyaa`.

## 🎯 Funcionalidades Principais

### 1. **Models de Torrent** (`src/models/Torrent.ts`)
- ✅ `Torrent`: Modelo completo de torrent com todas as informações
- ✅ `TorrentQuality`: Enum de qualidades (480p, 720p, 1080p, 4K, RAW)
- ✅ `TorrentLanguage`: Enum de idiomas (Japonês, Inglês, PT-BR, etc.)
- ✅ `TorrentCodec`: Enum de codecs (H.264, HEVC, AV1, etc.)
- ✅ `TorrentReleaseType`: Tipo de release (Episode, Batch, Season, Complete, etc.)
- ✅ `TorrentMetadata`: Metadata extraída do título do torrent
- ✅ `TorrentSearchFilter`: Filtros de busca
- ✅ `TorrentStats`: Estatísticas de torrents
- ✅ `EpisodeRange`: Range de episódios para batches

### 2. **TorrentRepository** (`src/repositories/TorrentRepository.ts`)
- ✅ Interface `ITorrentRepository` com todos os métodos
- ✅ Implementação `InMemoryTorrentRepository`
- ✅ Métodos de busca por:
  - ID
  - Anime ID
  - Episode ID
  - Filtros complexos (qualidade, idioma, seeders, etc.)
- ✅ CRUD completo (save, saveMany, delete, deleteByAnimeId)
- ✅ Ordenação automática por seeders

### 3. **NyaaService** (`src/services/NyaaService.ts`)
Serviço completo para indexação e gerenciamento de torrents:

#### Métodos Principais:
- ✅ `indexAnime(anime)`: Indexa todos os torrents de um anime
- ✅ `indexEpisode(anime, episodeNumber)`: Indexa torrents de episódio específico
- ✅ `searchTorrents(anime, filters)`: Busca torrents com filtros
- ✅ `getBestTorrentForEpisode(anime, episodeNumber)`: Retorna melhor torrent
- ✅ `getTorrentStats(animeId)`: Estatísticas completas
- ✅ `refreshTorrent(torrentId)`: Atualiza info (seeders/leechers)

#### Extração de Metadata:
- ✅ Qualidade do título (1080p, 720p, etc.)
- ✅ Codec (HEVC, H.264, AV1)
- ✅ Idiomas de áudio (detecta Dual Audio)
- ✅ Idiomas de legendas (detecta Multi-sub)
- ✅ Release group (do formato [Group])
- ✅ Tipo de release (Batch, Episode, etc.)
- ✅ Range de episódios (para batches)
- ✅ Número do episódio

#### Funcionalidades Avançadas:
- ✅ Deduplicação por info hash
- ✅ Filtro por seeders mínimos
- ✅ Filtro por trusted uploaders
- ✅ Busca com múltiplos títulos do anime
- ✅ Parse de tamanho (GB, GiB, MB, etc.)
- ✅ Detecção automática de qualidade preferida

### 4. **Integração com MiauIndex** (`src/MiauIndex.ts`)
A extensão Nyaa está integrada como addon opcional:

#### Configuração:
```typescript
const miauIndex = new MiauIndex({
  enableNyaa: true,        // Habilita extensão
  nyaaOptions: {
    autoIndex: true,       // Auto-save torrents
    minSeeders: 5,         // Mínimo de seeders
    trustedOnly: false,    // Apenas trusted
    preferredQuality: TorrentQuality.FULL_HD_1080p,
    preferredLanguages: [TorrentLanguage.JAPANESE],
  },
});
```

#### Métodos Adicionados ao MiauIndex:
- ✅ `indexTorrents(anime)`: Indexar torrents
- ✅ `indexEpisodeTorrents(anime, episodeNumber)`: Indexar episódio
- ✅ `searchTorrents(anime, filters)`: Buscar com filtros
- ✅ `getBestTorrent(anime, episodeNumber)`: Melhor torrent
- ✅ `getTorrentStats(animeId)`: Estatísticas
- ✅ `refreshTorrent(torrentId)`: Atualizar info
- ✅ `isNyaaEnabled`: Propriedade para verificar se está ativado

Todos os métodos verificam se a extensão está habilitada e lançam erro apropriado se não estiver.

### 5. **Exemplos Completos** (`examples/nyaa-extension.ts`)
Arquivo com 9 exemplos práticos:
1. ✅ Indexar todos os torrents de um anime
2. ✅ Indexar torrents de episódio específico
3. ✅ Buscar com filtros (qualidade, idioma, seeders)
4. ✅ Obter melhor torrent para episódio
5. ✅ Estatísticas de torrents
6. ✅ Buscar batches (múltiplos episódios)
7. ✅ Comparar diferentes qualidades
8. ✅ Buscar por idioma (dual audio, PT-BR subs)
9. ✅ Refresh de informações
10. ✅ Exemplo de múltiplos animes

### 6. **Testes** (`tests/NyaaService.basic.test.ts`)
- ✅ Testes de criação do serviço
- ✅ Testes de opções customizadas
- ✅ Testes de integração com repository
- ✅ Verificação de isNyaaEnabled

### 7. **Documentação** (`README.md`)
Seção completa sobre a extensão Nyaa incluindo:
- ✅ Instalação da extensão
- ✅ Características principais
- ✅ Exemplos de uso
- ✅ Todos os tipos disponíveis (Quality, Language, ReleaseType)
- ✅ Metadata extraída automaticamente
- ✅ Link para exemplos completos

### 8. **Package.json**
- ✅ `@kitsuneislife/nyaa` como **optionalDependency**
- ✅ `@kitsuneislife/nyaa` como **peerDependency** opcional
- ✅ `uuid` e `@types/uuid` adicionados às dependências

## 🎨 Destaques da Implementação

### Extração Inteligente de Metadata
O serviço extrai automaticamente informações dos títulos dos torrents:

```
Título: "[SubsPlease] One Piece - 1000 [1080p][Dual Audio][HEVC]"

Extrai:
✅ Quality: 1080p
✅ Codec: HEVC
✅ Audio: Japonês + Inglês (Dual Audio detectado)
✅ Episode: 1000
✅ Release Group: SubsPlease
```

### Busca Avançada com Filtros
```typescript
const torrents = await miauIndex.searchTorrents(anime, {
  quality: TorrentQuality.FULL_HD_1080p,
  subtitleLanguage: TorrentLanguage.PORTUGUESE_BR,
  episodeNumber: 1,
  minSeeders: 10,
  trustedOnly: true,
});
```

### Batches e Ranges
Detecta automaticamente torrents com múltiplos episódios:
```
Título: "[Group] Anime - 01-12 [1080p][Batch]"

Extrai:
✅ episodeRange: { start: 1, end: 12 }
✅ isBatch: true
✅ releaseType: BATCH
```

### Estatísticas Completas
```typescript
const stats = await miauIndex.getTorrentStats(anime.id);
// Retorna:
// - Total de torrents
// - Média de seeders
// - Tamanho total
// - Distribuição por qualidade
// - Distribuição por idioma
// - Distribuição por tipo de release
```

## 🔧 Arquitetura

A extensão segue a mesma arquitetura limpa do resto do projeto:

```
Models (Torrent.ts)
   ↓
Repositories (TorrentRepository.ts)
   ↓
Services (NyaaService.ts)
   ↓
MiauIndex (integração opcional)
```

## ✅ Status

- [x] Models de Torrent completos
- [x] Repository com todos os métodos
- [x] Service completo com extração de metadata
- [x] Integração com MiauIndex
- [x] Exemplos práticos
- [x] Testes básicos
- [x] Documentação completa
- [x] Compilação sem erros
- [x] Testes passando (68/68)

## 🚀 Como Usar

1. **Instalar a extensão:**
```bash
npm install @kitsuneislife/nyaa
```

2. **Habilitar no MiauIndex:**
```typescript
const miauIndex = new MiauIndex({
  enableNyaa: true,
});
```

3. **Usar:**
```typescript
const anime = await miauIndex.fetchAnime([...]);
const torrents = await miauIndex.indexTorrents(anime);
const best = await miauIndex.getBestTorrent(anime, 1);
```

## 📝 Notas

- A extensão é **100% opcional** - não afeta o funcionamento normal do MiauIndex
- Usa o pacote `@kitsuneislife/nyaa` que você mesmo criou
- Metadata é extraída automaticamente dos títulos dos torrents
- Suporta todos os formatos comuns de nomes de torrents de anime
- Deduplicação automática por info hash
- Ordenação automática por seeders

## 🎯 Próximos Passos Possíveis

- [ ] Cache de resultados de busca do Nyaa
- [ ] Integração com banco de dados
- [ ] Webhook para novos torrents
- [ ] Suporte a RSS feeds do Nyaa
- [ ] Download automático (integração com cliente torrent)
- [ ] Notificações de novos episódios
