# Estrutura de Diretórios e Arquivos - API SAP

## 📂 Novo Layout do Projeto com Integração SAP

```
dashboard_ordens/
├── app/                                # Next.js App Router
│   ├── api/                           # API Routes
│   │   └── sap/                       # 🆕 Endpoints SAP
│   │       ├── orders/
│   │       │   └── route.ts          # GET/POST ordens
│   │       ├── materials/
│   │       │   └── route.ts          # GET materiais
│   │       ├── sync/
│   │       │   └── route.ts          # POST sincronização
│   │       └── health/
│   │           └── route.ts          # GET status conexão
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                         # Componentes React
│   ├── dashboard/
│   │   ├── OrdersTable.tsx           # 🆕 Tabela de ordens
│   │   ├── MaterialsTable.tsx        # 🆕 Tabela de materiais
│   │   ├── SyncStatus.tsx            # 🆕 Status de sincronização
│   │   └── SapConnectionStatus.tsx   # 🆕 Status conexão SAP
│   └── shared/
│       └── ErrorBoundary.tsx
│
├── lib/                               # Lógica compartilhada
│   ├── services/                     # 🆕 Serviços de negócio
│   │   ├── sap.service.ts           # Client SAP
│   │   ├── cache.service.ts         # Gerenciador de cache
│   │   └── sync.service.ts          # Orquestrador de sync
│   │
│   ├── api/                         # 🆕 Clientes HTTP
│   │   ├── sap-client.ts           # HTTP client SAP
│   │   └── error-handler.ts        # Tratamento de erros
│   │
│   ├── types/                       # 🆕 Tipos TypeScript
│   │   ├── sap.types.ts            # Tipos SAP
│   │   ├── order.types.ts          # Tipos de ordem
│   │   └── material.types.ts       # Tipos de material
│   │
│   ├── mappers/                     # 🆕 Conversão de dados
│   │   ├── order.mapper.ts         # AUFK → Order
│   │   ├── material.mapper.ts      # MARD → Material
│   │   └── stock.mapper.ts         # MSEG → StockMovement
│   │
│   ├── hooks/                       # 🆕 React Hooks customizados
│   │   ├── useSapOrders.ts         # Hook para ordens
│   │   ├── useSapMaterials.ts      # Hook para materiais
│   │   └── useSapSync.ts           # Hook para sincronização
│   │
│   ├── config/                      # 🆕 Configurações
│   │   ├── sap.config.ts           # Config SAP
│   │   ├── cache.config.ts         # Config cache
│   │   └── api.config.ts           # Config API geral
│   │
│   ├── utils/                       # Utilitários
│   │   ├── data.ts                 # Dados fictícios
│   │   ├── metrics.ts              # Métricas
│   │   ├── materiais.ts            # Funções materiais
│   │   └── logger.ts               # 🆕 Logger
│   │
│   ├── data.ts
│   ├── materiais-custom.json
│   ├── materiais-hook.ts
│   ├── materiais-storage.ts
│   └── utils.ts
│
├── public/                          # Assets estáticos
│
├── docs/                            # 📚 Documentação
│   ├── SAP_SE16N_INTEGRATION.md     # 🆕 Integração SAP
│   ├── API_ENDPOINTS.md             # 🆕 Endpoints detalhados
│   ├── ARCHITECTURE.md              # 🆕 Arquitetura técnica
│   ├── SETUP_GUIDE.md               # 🆕 Guia de setup
│   ├── DEVELOPMENT.md               # 🆕 Guia de desenvolvimento
│   └── DEPLOYMENT.md                # 🆕 Deploy
│
├── .github/
│   └── workflows/                   # GitHub Actions
│       ├── deploy.yml               # Deploy automático
│       └── sap-sync.yml             # 🆕 Sincronização SAP
│
├── .env.example                     # 🆕 Variáveis de ambiente
├── .env.local                       # 🆕 (não commitado)
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json
└── README.md
```

---

## 🔍 Detalhamento dos Novos Arquivos

### API Routes (`app/api/sap/`)

#### `route.ts` (Base)
- Autenticação
- Rate limiting
- Error handling middleware
- CORS policies

#### `orders/route.ts`
- `GET` - Listar ordens com filtros
- `POST` - Criar requisição de sincronização

#### `materials/route.ts`
- `GET` - Listar materiais com filtros
- `POST` - Buscar estoque

#### `sync/route.ts`
- `POST` - Iniciar sincronização
- `GET` - Status de sincronização

#### `health/route.ts`
- `GET` - Verificar conexão com SAP
- Status de autenticação

---

### Services (`lib/services/`)

#### `sap.service.ts`
```typescript
class SapService {
  private client: SapClient;
  
  async getOrders(filters?: SapOrderFilters): Promise<SapOrder[]>
  async getMaterials(filters?: SapMaterialFilters): Promise<SapMaterial[]>
  async getStockMovements(filters?: SapStockFilters): Promise<StockMovement[]>
  async verifyConnection(): Promise<boolean>
  async authenticate(): Promise<AuthToken>
}
```

#### `cache.service.ts`
```typescript
class CacheService {
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async invalidate(pattern: string): Promise<void>
  async clear(): Promise<void>
  isExpired(key: string): boolean
}
```

#### `sync.service.ts`
```typescript
class SyncService {
  async syncOrders(): Promise<SyncResult>
  async syncMaterials(): Promise<SyncResult>
  async syncAll(): Promise<SyncResult>
  async getLastSyncTime(): Promise<Date | null>
  async getStatus(): Promise<SyncStatus>
}
```

---

### Types (`lib/types/`)

#### `sap.types.ts`
- Interfaces do SAP
- Enums de status
- Type guards

#### `order.types.ts`
- SapOrder
- SapOrderItem
- OrderStatus enum

#### `material.types.ts`
- SapMaterial
- MaterialType enum
- StockLevel

---

### Mappers (`lib/mappers/`)

Convertem estruturas SAP para frontend:
- `AUFK` (Cabeçalho Ordem) → `SapOrder`
- `AFPO` (Item Ordem) → `OrderItem`
- `MARD` (Estoque) → `StockData`
- `MSEG` (Movimento) → `StockMovement`

---

### Hooks (`lib/hooks/`)

```typescript
// useSapOrders.ts
function useSapOrders(filters?: OrderFilters) {
  return {
    data: SapOrder[],
    loading: boolean,
    error: Error | null,
    refetch: () => Promise<void>
  }
}

// useSapMaterials.ts
function useSapMaterials(plant?: string) {
  return {
    data: SapMaterial[],
    loading: boolean,
    error: Error | null,
    refetch: () => Promise<void>
  }
}

// useSapSync.ts
function useSapSync() {
  return {
    status: SyncStatus,
    isRunning: boolean,
    trigger: () => Promise<void>,
    lastSync: Date | null
  }
}
```

---

### Configuração (`.env.local`)

```bash
# SAP API Configuration
NEXT_PUBLIC_SAP_URL=https://sap.company.com:8000
SAP_API_USER=dashboard_user
SAP_API_PASSWORD=***
SAP_CLIENT=100
SAP_LANGUAGE=PT

# Cache Configuration
CACHE_TTL_ORDERS=300000        # 5 minutos
CACHE_TTL_MATERIALS=900000     # 15 minutos
CACHE_TTL_STOCK=600000         # 10 minutos
CACHE_ENABLED=true

# API Configuration
API_TIMEOUT=30000              # 30 segundos
API_RETRY_ATTEMPTS=3
API_RETRY_DELAY=1000           # 1 segundo

# Logging
LOG_LEVEL=info                 # debug, info, warn, error
LOG_FORMAT=json                # json, text
```

---

## 📋 Estrutura de Requisições HTTP

### Exemplo: GET /api/sap/orders

```
Request Headers:
  Authorization: Bearer {token}
  X-Request-ID: uuid-v4
  Accept-Encoding: gzip
  Content-Type: application/json

Query Parameters:
  ?status=RELEASED
  &plant=1000
  &limit=100
  &offset=0
  &sort=-createdAt

Response (200):
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 245,
    "limit": 100,
    "offset": 0,
    "pages": 3
  },
  "timestamp": "2026-06-09T14:30:00Z",
  "duration": "250ms"
}
```

---

## 🔒 Segurança

### Headers de Segurança
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'X-Request-ID': generateUUID(),
  'X-API-Version': 'v1',
  'User-Agent': 'DashboardOrdens/1.0'
}
```

### Rate Limiting
- 100 requisições / minuto por usuário
- 10 requisições / segundo para sync

### CORS
```typescript
cors: {
  origin: process.env.SAP_ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST']
}
```

---

## 📊 Arquivos de Configuração

### `next.config.mjs`
```javascript
// Adicionar:
// - API proxies para SAP
// - Compression para respostas grandes
// - Webpack config para otimizações
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "paths": {
      "@/services/*": ["lib/services/*"],
      "@/types/*": ["lib/types/*"],
      "@/api/*": ["lib/api/*"],
      "@/hooks/*": ["lib/hooks/*"]
    }
  }
}
```

### `package.json`
```json
{
  "dependencies": {
    // Adicionar:
    "axios": "^1.4.0",           // HTTP client
    "date-fns": "^2.30.0",       // Date utilities
    "zod": "^3.21.0",            // Schema validation
    "pino": "^8.14.0"            // Logger
  }
}
```

---

## 🧪 Arquivos de Testes (Recomendado)

```
__tests__/
├── unit/
│   ├── services/
│   │   ├── sap.service.test.ts
│   │   └── cache.service.test.ts
│   ├── mappers/
│   │   └── order.mapper.test.ts
│   └── utils/
│       └── logger.test.ts
├── integration/
│   ├── api-routes.test.ts
│   └── sap-sync.test.ts
└── fixtures/
    ├── sap-orders.json
    ├── sap-materials.json
    └── sap-responses.json
```

---

## 📝 Checklist de Implementação

- [ ] Estrutura de diretórios criada
- [ ] Types TypeScript definidos
- [ ] SapService implementado
- [ ] CacheService implementado
- [ ] Mappers criados
- [ ] API routes configuradas
- [ ] Hooks React criados
- [ ] Componentes atualizados
- [ ] Variáveis de ambiente configuradas
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Documentação completa
- [ ] Deploy em staging
- [ ] Testes em produção

---

## 🔗 Referências Cruzadas

- [SAP SE16N Integration](./SAP_SE16N_INTEGRATION.md)
- [API Endpoints](./API_ENDPOINTS.md)
- [Architecture](./ARCHITECTURE.md)
- [Setup Guide](./SETUP_GUIDE.md)

---

**Versão**: 1.0.0  
**Data**: 09/06/2026  
**Autor**: EriFranca
