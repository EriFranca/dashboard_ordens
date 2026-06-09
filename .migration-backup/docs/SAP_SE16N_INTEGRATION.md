# Integração com API SAP - Transação SE16N

## 📋 Visão Geral

Este documento descreve a arquitetura e implementação da integração entre o **Dashboard de Ordens** e a **API do SAP** através da transação **SE16N** (Data Browser) para consumir dados de tabelas do SAP.

---

## 🎯 Objetivos da Integração

- ✅ Buscar dados de ordens planejadas do SAP
- ✅ Importar informações de materiais e estoque
- ✅ Sincronizar dados de produção em tempo real
- ✅ Manter cache local para melhor performance
- ✅ Implementar tratamento de erros e retry logic

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│         Dashboard de Ordens (Next.js)           │
├─────────────────────────────────────────────────┤
│  Frontend (React Components + UI)               │
├─────────────────────────────────────────────────┤
│  API Routes (Next.js API Routes)                │
│  ├── /api/sap/orders                            │
│  ├── /api/sap/materials                         │
│  └── /api/sap/sync                              │
├─────────────────────────────────────────────────┤
│  Services Layer                                 │
│  ├── SapService (API Client)                    │
│  ├── CacheService (Local Storage + Memory)      │
│  └── ErrorHandler (Logging + Retry)             │
├─────────────────────────────────────────────────┤
│  Data Layer                                     │
│  ├── Types/Interfaces (TypeScript)              │
│  └── Mappers (SAP → Frontend)                   │
└─────────────────────────────────────────────────┘
         ↓ HTTP(S) REST Calls
┌─────────────────────────────────────────────────┐
│    SAP API Gateway / OData Service              │
│    (SAP NetWeaver / S/4HANA)                    │
├─────────────────────────────────────────────────┤
│    Transação SE16N (Data Browser)               │
│    Tables: AUFK, AFPO, MARD, MSEG, etc.         │
└─────────────────────────────────────────────────┘
```

---

## 🔌 Transação SE16N

### O que é?
A transação **SE16N** no SAP permite:
- Acesso genérico a tabelas de dados
- Filtros avançados
- Exportação de dados
- Acesso via OData ou REST API

### Principais Tabelas de Referência

| Tabela | Descrição | Uso |
|--------|-----------|-----|
| **AUFK** | Cabeçalho de Ordens de Produção | Dados principais de ordens |
| **AFPO** | Posições de Ordens de Produção | Itens e componentes |
| **MARD** | Dados de Estoque por Depósito | Saldos disponíveis |
| **MSEG** | Movimentação de Materiais | Histórico de movimentos |
| **MAKT** | Texto de Materiais | Descrições de materiais |

---

## 📡 Endpoints da API SAP

### Configuração de Conexão

```typescript
// Variáveis de Ambiente (.env.local)
NEXT_PUBLIC_SAP_URL=https://sap-server.company.com:8000
SAP_API_USER=username
SAP_API_PASSWORD=password
SAP_CLIENT=100
SAP_LANGUAGE=PT
```

### Exemplos de Endpoints

#### 1. Buscar Ordens de Produção
```
GET /api/sap/orders?filters[status]=RELEASED&filters[plant]=1000
```

**Resposta:**
```json
{
  "data": [
    {
      "orderId": "1234567",
      "description": "Produção XYZ",
      "status": "RELEASED",
      "startDate": "2026-06-10",
      "endDate": "2026-06-15",
      "quantity": 1000,
      "plant": "1000",
      "costCenter": "CC001"
    }
  ],
  "total": 45,
  "timestamp": "2026-06-09T14:30:00Z"
}
```

#### 2. Buscar Detalhes de Uma Ordem
```
GET /api/sap/orders/:orderId/details
```

**Resposta:**
```json
{
  "orderId": "1234567",
  "header": { /* dados de AUFK */ },
  "items": [ /* dados de AFPO */ ],
  "materials": [ /* dados de materiais */ ],
  "stock": { /* dados de MARD */ }
}
```

#### 3. Buscar Materiais
```
GET /api/sap/materials?filters[plant]=1000&filters[warehouse]=001
```

**Resposta:**
```json
{
  "data": [
    {
      "materialId": "MAT001",
      "description": "Material de Teste",
      "unit": "PC",
      "quantity": 500,
      "reorderPoint": 100,
      "safetyStock": 50
    }
  ]
}
```

#### 4. Sincronizar Dados
```
POST /api/sap/sync
```

**Payload:**
```json
{
  "syncType": "full|partial",
  "tables": ["AUFK", "AFPO", "MARD"],
  "filters": {
    "modifiedSince": "2026-06-08T00:00:00Z"
  }
}
```

---

## 🔐 Autenticação

### Basic Auth (HTTP)
```typescript
const auth = Buffer.from(`${SAP_USER}:${SAP_PASSWORD}`).toString('base64');
headers['Authorization'] = `Basic ${auth}`;
```

### SAP NetWeaver Authentication
```typescript
// Algumas instalações usam SAML ou OAuth2
// Consulte seu administrador SAP
```

---

## 💾 Estrutura de Dados

### Tipos TypeScript

#### Order (Ordem de Produção)
```typescript
interface SapOrder {
  orderId: string;
  description: string;
  status: 'CREATED' | 'RELEASED' | 'INPROCESS' | 'COMPLETED' | 'DELETED';
  plannedStartDate: string; // ISO 8601
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  quantity: number;
  unit: string;
  plant: string;
  workCenter?: string;
  costCenter?: string;
  material?: string;
  version?: number;
  createdAt?: string;
  modifiedAt?: string;
}
```

#### Material
```typescript
interface SapMaterial {
  materialId: string;
  description: string;
  type: string; // FERT, HALB, ROHM, etc.
  unit: string; // PC, KG, M, etc.
  warehouse?: string;
  quantity: number;
  reorderPoint: number;
  safetyStock: number;
  leadTime: number; // dias
  lastMovement?: string;
}
```

#### Stock Movement
```typescript
interface StockMovement {
  movementId: string;
  materialId: string;
  quantity: number;
  movementType: string; // 261, 262, 643, etc.
  date: string;
  reference?: string;
  warehouse?: string;
  bin?: string;
}
```

---

## 🛠️ Implementação

### 1. Serviço SAP (lib/services/sap.service.ts)

```typescript
// Responsável pela comunicação com API SAP
// - Requisições HTTP
// - Tratamento de erros
// - Retry logic
// - Logging
```

### 2. Cache Service (lib/services/cache.service.ts)

```typescript
// Gerencia cache local
// - Memory cache (sessão)
// - IndexedDB para persistência
// - Invalidação de cache
// - TTL (Time To Live)
```

### 3. Data Mapper (lib/mappers/sap.mapper.ts)

```typescript
// Converte dados SAP para formato frontend
// - AUFK → SapOrder
// - MARD → SapMaterial
// - MSEG → StockMovement
```

---

## 📊 Fluxo de Sincronização

```
┌─────────────┐
│ Iniciar App │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ Verificar Cache      │
│ (IndexedDB)          │
└──────┬───────────────┘
       │
       ├─ Válido (TTL OK)
       │  └─→ Usar dados em cache
       │
       └─ Inválido ou vazio
          └─→ Buscar do SAP
              └─→ Processar dados
                  └─→ Armazenar em cache
                      └─→ Atualizar UI
```

---

## ⏰ Sincronização Automática

O dashboard deve sincronizar dados periodicamente:

```typescript
// Intervalo de sincronização
- A cada 5 minutos: Ordens ativas
- A cada 15 minutos: Materiais e estoque
- A cada 1 hora: Dados históricos
- Sob demanda: Manual via botão
```

---

## 🚨 Tratamento de Erros

### Cenários de Erro

| Erro | Tratamento | Retry |
|------|-----------|-------|
| 401 Unauthorized | Re-autenticar | Sim (1x) |
| 403 Forbidden | Log de segurança | Não |
| 404 Not Found | Não sincronizar | Não |
| 500 Server Error | Log e fila | Sim (3x com backoff) |
| Timeout | Cache ou fallback | Sim (2x) |
| Sem conexão | Modo offline (cache) | Sim (periódico) |

---

## 📈 Performance e Otimizações

### Estratégias

1. **Paginação**
   - Buscar dados em lotes de 100-500 registros
   - Lazy loading no frontend

2. **Filtros**
   - Filtrar no SAP (server-side) sempre que possível
   - Reduzir volume de dados transferido

3. **Cache Inteligente**
   - TTL baseado em tipo de dado
   - Cache local com IndexedDB
   - Service Worker para offline

4. **Compressão**
   - Habilitar gzip em requisições
   - Serialização eficiente

5. **Índices**
   - Criar índices no IndexedDB
   - Otimizar queries de busca local

---

## 📝 Logs e Monitoramento

### Pontos de Log

```typescript
// 1. Início de sincronização
LOG.info('Iniciando sincronização SAP', { tables, filters });

// 2. Durante processamento
LOG.debug('Processando 250 registros de AUFK');

// 3. Sucesso
LOG.info('Sincronização concluída', { recordsProcessed, duration });

// 4. Erros
LOG.error('Falha na sincronização SAP', { error, attempt, retry });

// 5. Métrica de performance
LOG.metric('sap_sync_duration', duration, { tables, recordCount });
```

### Dashboard de Monitoramento

- Última sincronização
- Status de conexão SAP
- Erros recentes
- Performance (latência, volume)
- Quota de requisições

---

## 🔄 Roadmap de Implementação

### Fase 1: Infraestrutura
- [ ] Criar tipos TypeScript para dados SAP
- [ ] Implementar SapService (HTTP client)
- [ ] Setup de autenticação SAP
- [ ] Testes unitários

### Fase 2: Funcionalidades Básicas
- [ ] API route para buscar ordens
- [ ] API route para buscar materiais
- [ ] Integração com componentes frontend
- [ ] Cache básico

### Fase 3: Otimizações
- [ ] IndexedDB para persistência
- [ ] Service Worker para offline
- [ ] Retry logic com backoff
- [ ] Compressão de dados

### Fase 4: Monitoramento
- [ ] Logging centralizado
- [ ] Métricas de performance
- [ ] Alertas de erro
- [ ] Dashboard de status

---

## 📚 Referências

- [SAP NetWeaver REST API](https://help.sap.com)
- [OData v4 Specification](https://www.odata.org)
- [Transação SE16N Documentation](https://help.sap.com/viewer/saphelp_nw73/7.3.20)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## 👥 Contato & Suporte

Para dúvidas sobre integração SAP, entre em contato com:
- **Administrador SAP**: [contato SAP]
- **Time de DevOps**: [email]
- **Tech Lead**: EriFranca

---

**Última atualização**: 09/06/2026  
**Status**: Em Planejamento  
**Versão**: 1.0.0-draft
