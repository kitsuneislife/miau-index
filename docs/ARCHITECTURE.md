# Arquitetura do Miau-Index

## Visão Geral

O Miau-Index segue uma arquitetura em camadas limpa e modular, facilitando manutenção, testes e extensibilidade.

```
┌─────────────────────────────────────────────────────────┐
│                    MiauIndex (API)                       │
│                  Ponto de Entrada                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              AnimeUnificationService                     │
│           (Lógica de Unificação de Dados)               │
└─────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
┌───────────────────────┐   ┌──────────────────────┐
│     Providers         │   │    Repository        │
│  (Fontes Externas)    │   │  (Persistência)      │
│                       │   │                      │
│ • MyAnimeList         │   │ • InMemory           │
│ • AniList             │   │ • (Future: DB)       │
│ • Kitsu               │   │                      │
└───────────────────────┘   └──────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│                    External APIs                         │
│        MAL API / AniList GraphQL / Kitsu API            │
└─────────────────────────────────────────────────────────┘
```

## Camadas

### 1. API Layer (MiauIndex)

**Responsabilidade:** Ponto de entrada principal, orquestra as operações

**Componentes:**
- `MiauIndex`: Classe principal que expõe a API pública

**Métodos:**
- `fetchAnime()`: Busca e unifica dados de anime
- `searchAnime()`: Busca em múltiplas fontes
- `getAnimeById()`: Busca no repositório local
- `searchLocal()`: Busca local

### 2. Service Layer

**Responsabilidade:** Lógica de negócio e unificação de dados

**Componentes:**
- `AnimeUnificationService`: Unifica dados de múltiplas fontes

**Estratégias de Unificação:**
1. **Consenso por Maioria**: Para campos conflitantes
2. **Priorização de Fontes**: Usa fontes preferenciais
3. **Merge de Arrays**: Combina listas (gêneros, temas)
4. **Seleção Inteligente**: Escolhe a melhor informação disponível

### 3. Provider Layer

**Responsabilidade:** Integração com APIs externas

**Componentes:**
- `BaseAnimeProvider`: Classe base abstrata
- `MyAnimeListProvider`: Integração com MAL
- `AniListProvider`: Integração com AniList
- `KitsuProvider`: Integração com Kitsu

**Recursos:**
- Retry com backoff exponencial
- Health checks
- Normalização de dados
- Tratamento de erros

### 4. Repository Layer

**Responsabilidade:** Persistência e recuperação de dados

**Componentes:**
- `IAnimeRepository`: Interface do repositório
- `InMemoryAnimeRepository`: Implementação em memória

**Operações:**
- CRUD básico
- Busca por título
- Busca por ID externo
- Paginação

### 5. Model Layer

**Responsabilidade:** Definição de estruturas de dados

**Modelos Principais:**
- `Anime`: Dados completos do anime
- `Episode`: Informações de episódios
- `AnimeSeason`: Temporadas/cours
- `Character`: Personagens
- `Studio`: Estúdios de animação
- `VoiceActor`: Dubladores
- `StaffMember`: Equipe de produção

### 6. Types Layer

**Responsabilidade:** Definições de tipos e enums TypeScript

**Tipos:**
- Enums: `AnimeType`, `AnimeStatus`, `Season`, `DataSource`, `AgeRating`
- Interfaces: `Title`, `Image`, `Rating`, `ExternalId`, `DateRange`

## Fluxo de Dados

### Fetching e Unificação

```
1. User chama miauIndex.fetchAnime([...externalIds])
                    ↓
2. MiauIndex → AnimeUnificationService.fetchAndUnify()
                    ↓
3. Para cada externalId:
   - Provider.fetchAnimeById(id)
   - Normaliza dados para formato Anime
                    ↓
4. AnimeUnificationService.unifyAnimeData()
   - Compara dados de todas as fontes
   - Aplica estratégias de unificação
   - Merge de arrays (genres, themes)
   - Combina ratings
                    ↓
5. Repository.save(unifiedAnime)
                    ↓
6. Retorna Anime unificado
```

### Search Flow

```
1. User chama miauIndex.searchAnime(query)
                    ↓
2. MiauIndex → AnimeUnificationService.searchAndUnify()
                    ↓
3. Para cada Provider:
   - Provider.searchAnime(query)
   - Coleta resultados
                    ↓
4. Agrupa resultados por título similar
                    ↓
5. Unifica grupos de resultados
                    ↓
6. Retorna lista de Animes unificados
```

## Padrões de Design

### 1. Repository Pattern
- Abstrai a camada de persistência
- Permite trocar implementações facilmente
- Facilita testes com mocks

### 2. Strategy Pattern
- Diferentes estratégias de unificação
- Providers intercambiáveis
- Configuração flexível

### 3. Factory Pattern
- Criação de providers
- Instanciação de modelos
- Geração de IDs

### 4. Dependency Injection
- Services recebem dependências no construtor
- Facilita testes
- Desacoplamento

## Extensibilidade

### Adicionar Novo Provider

```typescript
import { BaseAnimeProvider } from './providers/BaseProvider';

export class NovoProvider extends BaseAnimeProvider {
  constructor() {
    super('https://api.novo.com');
  }

  getSource(): DataSource {
    return DataSource.NOVO;
  }

  async fetchAnimeById(id: string): Promise<Anime | null> {
    const response = await this.fetchWithRetry(() =>
      axios.get(`${this.baseUrl}/anime/${id}`)
    );
    return this.normalizeToAnime(response.data);
  }

  // ... outros métodos
}
```

### Adicionar Novo Repositório

```typescript
export class PostgresAnimeRepository implements IAnimeRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Anime | null> {
    const result = await this.db.query(
      'SELECT * FROM animes WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // ... outros métodos
}
```

## Performance

### Otimizações Implementadas

1. **Cache**: Sistema de cache configurável
2. **Retry com Backoff**: Reduz falhas temporárias
3. **Busca Paralela**: Múltiplos providers simultaneamente
4. **Rate Limiting**: Respeita limites das APIs

### Otimizações Futuras

1. **Cache Distribuído**: Redis para cache compartilhado
2. **Database Indexing**: Índices otimizados para busca
3. **GraphQL API**: API eficiente para consultas
4. **CDN para Imagens**: Cache de assets
5. **Lazy Loading**: Carregar dados sob demanda

## Segurança

### Práticas Implementadas

1. **Validação de Entrada**: Zod schemas
2. **Sanitização**: Limpeza de dados externos
3. **Error Handling**: Tratamento robusto de erros
4. **Type Safety**: TypeScript strict mode

### Considerações Futuras

1. **Authentication**: Sistema de autenticação
2. **Authorization**: Controle de acesso
3. **Rate Limiting por Usuário**: Limites individuais
4. **API Keys**: Gerenciamento seguro de chaves

## Testabilidade

### Estratégias

1. **Unit Tests**: Testes de unidade para cada componente
2. **Integration Tests**: Testes de integração entre camadas
3. **Mocks**: Providers e repositórios mockados
4. **Test Coverage**: Cobertura de código alta

### Exemplo

```typescript
describe('AnimeUnificationService', () => {
  let service: AnimeUnificationService;
  let mockRepository: jest.Mocked<IAnimeRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      // ... outros métodos
    };
    service = new AnimeUnificationService(mockRepository);
  });

  it('should unify anime data', async () => {
    // Test implementation
  });
});
```

## Monitoramento e Logging

### Sistema de Logs

```typescript
import { logger, LogLevel } from 'miau-index';

logger.setLevel(LogLevel.DEBUG);
logger.info('Fetching anime', { id: '1' });
logger.error('Failed to fetch', error);
```

### Níveis de Log

- `DEBUG`: Informações detalhadas
- `INFO`: Informações gerais
- `WARN`: Avisos
- `ERROR`: Erros

## Configuração

### Variáveis de Ambiente

```env
# APIs
MAL_CLIENT_ID=xxx
ANILIST_CLIENT_ID=xxx

# App
NODE_ENV=production
LOG_LEVEL=info

# Repository
REPOSITORY_TYPE=postgres
DATABASE_URL=postgresql://...

# Cache
CACHE_ENABLED=true
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_RPM=60
```

## Deployment

### Opções

1. **Standalone Library**: NPM package
2. **API Service**: REST/GraphQL server
3. **Serverless**: AWS Lambda, Vercel Functions
4. **Container**: Docker

### Exemplo Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## Conclusão

A arquitetura do Miau-Index foi projetada para ser:
- **Modular**: Componentes independentes
- **Extensível**: Fácil adicionar funcionalidades
- **Testável**: Alta cobertura de testes
- **Performática**: Otimizações de cache e paralelização
- **Segura**: Validação e tratamento robusto
- **Manutenível**: Código limpo e documentado
