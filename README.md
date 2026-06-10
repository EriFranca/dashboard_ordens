# Monitor de Ordens Planejadas — SAP Dashboard

Dashboard de monitoramento de ordens de produção planejadas do SAP (Centro 8001 · PP01), com KPIs, gráficos e tabela filtrável. Projetado para receber dados via API Python integrada ao SAP.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        SAP ERP                              │
└─────────────────────┬───────────────────────────────────────┘
                      │  RFC / BAPI / relatório ABAP
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            Python SAP Extractor  (a implementar)            │
│  - Lê ordens PP01 do centro 8001                            │
│  - Transforma para o schema JSON abaixo                     │
│  - POST /api/sap/orders  →  Express API (este repo)         │
└─────────────────────┬───────────────────────────────────────┘
                      │  HTTP POST (JSON)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│          Express API  (artifacts/api-server)                │
│  Node.js 24 · Express 5 · Drizzle ORM · PostgreSQL         │
│  Porta: $PORT (padrão 5000)                                 │
│  Prefixo: /api                                              │
│                                                             │
│  Endpoints existentes:                                      │
│    GET  /api/healthz        → health check                  │
│    POST /api/sap/sync       → dispara sync (stub)           │
│    GET  /api/sap/sync       → status do último sync (stub)  │
│                                                             │
│  Endpoints a implementar:                                   │
│    POST /api/sap/orders     → recebe batch de ordens        │
│    GET  /api/orders         → lista ordens (com filtros)    │
└─────────────────────┬───────────────────────────────────────┘
                      │  TanStack Query (hooks gerados por Orval)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│        React Dashboard  (artifacts/dashboard-ordens)        │
│  Vite 6 · React 19 · Recharts · Tailwind · shadcn/ui        │
│  Atualmente lê dados estáticos de src/lib/data.ts           │
│  (migração para API planejada após schema de DB definido)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | 24 |
| Linguagem | TypeScript | 5.9 |
| Gerenciador de pacotes | pnpm workspaces | 10 |
| API | Express | 5 |
| ORM | Drizzle ORM | latest |
| Banco de dados | PostgreSQL | — |
| Validação | Zod v4 + drizzle-zod | — |
| Codegen de cliente | Orval (OpenAPI → hooks) | — |
| Frontend | React + Vite | 19 / 6 |
| Gráficos | Recharts | 3 |
| UI | shadcn/ui + Tailwind | v4 |
| Logging | pino + pino-http | — |

---

## Estrutura do monorepo

```
/
├── artifacts/
│   ├── api-server/          # Express API (backend)
│   │   └── src/
│   │       ├── app.ts       # Express setup (cors, json, logger)
│   │       ├── index.ts     # Entrypoint, bind $PORT
│   │       ├── routes/
│   │       │   ├── index.ts
│   │       │   ├── health.ts
│   │       │   └── sap.ts   # Endpoints de sync (stubs)
│   │       └── lib/
│   │           └── logger.ts
│   │
│   └── dashboard-ordens/    # React frontend
│       └── src/
│           ├── App.tsx              # Layout + navegação lateral
│           ├── components/
│           │   ├── dashboard.tsx    # View "Detalhes das Ordens"
│           │   ├── graficos.tsx     # Todos os gráficos Recharts
│           │   ├── tabela-ordens.tsx
│           │   └── sync-status.tsx  # Painel de sincronização SAP
│           └── lib/
│               ├── data.ts          # 500 ordens SAP (dados estáticos atuais)
│               ├── metrics.ts       # Lógica de KPIs, status, agregações
│               ├── materiais.ts     # Registro de 118 materiais
│               ├── materiais-storage.ts  # Edições locais via localStorage
│               └── hooks/
│                   └── useSyncScheduler.ts  # Agendador diário (21:00)
│
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec + config Orval
│   │   └── openapi.yaml     # fonte da verdade do contrato de API
│   ├── api-client-react/    # Hooks TanStack Query (gerados)
│   ├── api-zod/             # Schemas Zod (gerados)
│   └── db/
│       └── src/
│           ├── index.ts     # Conexão Drizzle + pg
│           └── schema/
│               └── index.ts # Schema do banco (vazio — a implementar)
```

---

## Contrato de dados (schema `Ordem`)

O tipo TypeScript atual define a estrutura esperada de cada ordem:

```typescript
type Ordem = {
  ordem: string           // Número da ordem SAP (ex: "100001430946")
  op: string | null       // Ordem de processo vinculada
  material: string        // Código do material (ex: "254410")
  unid: string            // Unidade: "UN" | "KG" | "L"
  qtd: number             // Quantidade total da ordem
  qtdEntrada: number      // Col P — quantidade confirmada (mercadoria entrada)
  qtdPlan: number         // Col V — quantidade planejada
  desvio: number          // qtdEntrada - qtdPlan
  valor: number           // Valor EM (em reais)
  dtAbertura: string | null     // "DD/MM/YYYY"
  dtInicio: string | null       // "DD/MM/YYYY"
  dtRemessaPlan: string | null  // "DD/MM/YYYY"
  dtRemessaReal: string | null  // "DD/MM/YYYY"
  recebConcluido: boolean       // Flag de conclusão de recebimento
  dataFim: string | null        // "DD/MM/YYYY"
  centro: string          // Centro SAP (ex: "8001")
  tipoOrdem: string       // Tipo (ex: "PP01")
}
```

---

## Lógica de status das ordens

| Status | Condição |
|---|---|
| **Extra** | `qtdPlan === 0 && qtdEntrada > 0` |
| **Concluído** | `recebConcluido && qtdEntrada >= qtdPlan && qtdPlan > 0` |
| **Parcial** | `qtdEntrada > 0` (e não se enquadra acima) |
| **Pendente** | `qtdEntrada === 0` |

---

## Conversão de unidade (UN → KG)

Materiais com unidade `UN` e fator de peso configurado:

| Material | Descrição resumida | Peso/unidade |
|---|---|---|
| 254410 | PANETONE FRUTAS 400G | 0,400 kg |
| 254509 | PIZZA FAB PROP 400G | 0,400 kg |
| 251061–251065 | SALGADOS FOLHADOS 150G | 0,150 kg |
| 255127 | CROISSANT 150G | 0,150 kg |
| 255378 | PASTEL FRANGO 150G | 0,150 kg |

Os demais materiais em `KG` ou `L` usam `qtdEntrada` diretamente.

---

## Integração com a API Python SAP

### Estado atual
O endpoint `POST /api/sap/sync` existe mas retorna resposta mock. O dashboard lê dados estáticos de `src/lib/data.ts`.

### O que a API Python precisa fazer

**1. Extrair ordens do SAP** via RFC/BAPI ou relatório ABAP (ex: COOIS), filtrando:
- Centro: `8001`
- Tipo de ordem: `PP01`
- Período desejado

**2. Transformar para o schema JSON** acima (campos obrigatórios: `ordem`, `material`, `unid`, `qtdEntrada`, `qtdPlan`, `centro`, `tipoOrdem`)

**3. Enviar via HTTP POST para:**
```
POST /api/sap/orders        (endpoint a implementar)
Content-Type: application/json

{
  "ordens": [ ...array de Ordem... ],
  "fonte": "SAP-8001",
  "timestamp": "2026-06-10T21:00:00Z"
}
```

### O que precisa ser implementado neste repo para receber os dados

- [x] **Schema do banco** (`lib/db/src/schema/index.ts`) — tabela `ordens` com indexes em `material`, `centro`, `dt_abertura`
- [x] **Endpoint** `POST /api/sap/orders` — valida cada ordem com drizzle-zod, faz upsert no PostgreSQL
- [x] **Endpoint** `GET /api/orders` — lista ordens com filtros opcionais (`centro`, `material`, `tipoOrdem`, `busca`, `limit`, `offset`)
- [x] **OpenAPI spec** (`lib/api-spec/openapi.yaml`) — endpoints documentados; hooks React gerados via Orval
- [ ] **Migrar dashboard** — substituir `data.ts` estático por chamadas à API via hooks gerados (próximo passo após conectar API Python)

---

## Comandos úteis

```bash
# Rodar API
pnpm --filter @workspace/api-server run dev

# Rodar dashboard
pnpm --filter @workspace/dashboard-ordens run dev

# Aplicar schema no banco (dev)
pnpm --filter @workspace/db run push

# Regenerar hooks e schemas a partir do OpenAPI
pnpm --filter @workspace/api-spec run codegen

# Typecheck completo
pnpm run typecheck

# Build completo
pnpm run build
```

---

## Variáveis de ambiente necessárias

| Variável | Descrição | Obrigatório |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | Sim |

---

## Fluxo de dados planejado (pós-integração)

```
SAP (21:00)
  └─► Python Extractor
        └─► POST /api/sap/orders  (com batch de ordens)
              └─► Express valida (Zod) + faz upsert (Drizzle)
                    └─► PostgreSQL
                          └─► GET /api/orders  (React Query, polling ou on-demand)
                                └─► Dashboard renderiza KPIs e gráficos
```

O agendador no frontend (`useSyncScheduler`) já dispara `POST /api/sap/sync` diariamente às 21:00 — esse endpoint pode ser estendido para chamar a API Python ou simplesmente aguardar o push externo.
