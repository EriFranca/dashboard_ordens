# 🔗 Integração com API SAP

Guia completo para integrar o Dashboard de Ordens com APIs do SAP.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Recomendada](#arquitetura-recomendada)
3. [Endpoints SAP Necessários](#endpoints-sap-necessários)
4. [Configuração de Autenticação](#configuração-de-autenticação)
5. [Implementação do Cliente](#implementação-do-cliente)
6. [Cache e Performance](#cache-e-performance)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Exemplo Prático](#exemplo-prático)

---

## 🎯 Visão Geral

A integração SAP envolve:
- **Backend intermediário** (Node.js/Next.js API Routes)
- **Autenticação segura** (tokens, credenciais)
- **Endpoints REST** para obter dados de:
  - Ordens de Produção (PP)
  - Materiais
  - Centros de Trabalho
  - Status de execução

---

## 🏗️ Arquitetura Recomendada

```
┌─────────────────────────────────────────┐
│     Dashboard (Next.js Frontend)        │
│  (React Components, Charts, UI)         │
└────────────────┬────────────────────────┘
                 │ HTTP/REST
                 │
┌────────────────▼────────────────────────┐
│   API Routes (Next.js Backend)          │
│  /api/sap/ordens                        │
│  /api/sap/materiais                     │
│  /api/sap/centros                       │
│  (Validação, Cache, Transform)          │
└────────────────┬────────────────────────┘
                 │ SOAP/REST
                 │
┌────────────────▼────────────────────────┐
│       SAP System (PI, OData, SOAP)      │
│  - SAP PP Module                        │
│  - Material Master                      │
│  - Production Orders                    │
└─────────────────────────────────────────┘
```

---

## 📡 Endpoints SAP Necessários

### 1. **Ordens de Produção (SAP PP)**

**Endpoint OData (Recomendado):**
```
/sap/opu/odata/sap/C_PRODUCTIONORDER_SRV/C_ProductionOrder
```

**Dados que queremos:**
- Número da Ordem
- Material
- Centro de trabalho
- Data início/fim
- Status
- Quantidade planejada
- Quantidade executada

**Exemplo de Resposta:**
```json
{
  "value": [
    {
      "ProductionOrder": "1000001",
      "Material": "MAT-001",
      "WorkCenter": "8001",
      "ScheduledStartDate": "2026-06-08",
      "ScheduledEndDate": "2026-06-10",
      "OrderStatus": "RELEASED",
      "PlannedQuantity": "100.00",
      "ExecutedQuantity": "45.00"
    }
  ]
}
```

### 2. **Material Master**

**Endpoint OData:**
```
/sap/opu/odata/sap/C_MATERIAL_SRV/C_Material
```

**Dados que queremos:**
- Código do material
- Descrição
- Unidade de medida
- Tipo de material
- Categoria

### 3. **Centros de Trabalho**

**Endpoint OData:**
```
/sap/opu/odata/sap/C_WORKCENTER_SRV/C_WorkCenter
```

**Dados que queremos:**
- Código do centro
- Descrição
- Capacidade
- Status

### 4. **Execução de Ordens (Feedback)**

**Endpoint OData/SOAP:**
```
/sap/opu/odata/sap/C_ORDEREXECUTION_SRV/C_OrderExecution
```

---

## 🔐 Configuração de Autenticação

### Opção 1: **SAP ABAP (Basic Auth + OAuth2)**

```bash
# .env.local (NUNCA commitar no git)
SAP_HOST=https://seu-sap-server.com
SAP_PORT=50000
SAP_CLIENT=100
SAP_USER=seu_usuario
SAP_PASSWORD=sua_senha_criptografada
SAP_OAUTH_CLIENT_ID=seu_client_id
SAP_OAUTH_CLIENT_SECRET=seu_client_secret
```

### Opção 2: **SAP Cloud (Basic Auth com Cloud Connector)**

```bash
SAP_CLOUD_URL=https://seu-tenant.authentication.sap.hana.ondemand.com
SAP_CLOUD_USER=seu_usuario
SAP_CLOUD_PASSWORD=sua_senha
```

### Opção 3: **OAuth2 com JWT (Melhor prática)**

```bash
SAP_JWT_KEYSTORE_PATH=./certs/keystore.jks
SAP_JWT_KEYSTORE_PASSWORD=password
SAP_JWT_KEY_ALIAS=sap_key
```

---

## 💻 Implementação do Cliente

### 1. **Criar Hook para dados do SAP**

```typescript
// lib/sap/useSapOrders.ts
'use client'

import { useEffect, useState } from 'react'

export interface SapOrder {
  id: string
  numero: string
  material: string
  centro: string
  dataInicio: Date
  dataFim: Date
  status: 'RELEASED' | 'STARTED' | 'COMPLETED' | 'ARCHIVED'
  qtdPlanejada: number
  qtdExecutada: number
  progresso: number
}

export function useSapOrders() {
  const [orders, setOrders] = useState<SapOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sap/ordens')
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar ordens: ${response.statusText}`)
      }

      const data = await response.json()
      setOrders(data.ordens || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  return { orders, loading, error, refetch: fetchOrders }
}
```

### 2. **API Route para buscar dados do SAP**

```typescript
// app/api/sap/ordens/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchFromSap } from '@/lib/sap/client'
import { transformSapOrder } from '@/lib/sap/transforms'

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar dados do SAP
    const sapData = await fetchFromSap(
      '/sap/opu/odata/sap/C_PRODUCTIONORDER_SRV/C_ProductionOrder',
      {
        $filter: "OrderStatus ne 'ARCHIVED'",
        $top: 1000,
      }
    )

    // Transformar dados para o formato esperado
    const ordensTransformadas = sapData.value.map(transformSapOrder)

    // Retornar com cache
    const response = NextResponse.json({
      ordens: ordensTransformadas,
      timestamp: new Date().toISOString(),
    })

    // Cache por 5 minutos
    response.headers.set('Cache-Control', 'public, max-age=300')
    
    return response
  } catch (error) {
    console.error('Erro ao buscar ordens do SAP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do SAP' },
      { status: 500 }
    )
  }
}
```

### 3. **Cliente SAP (Abstração)**

```typescript
// lib/sap/client.ts
import axios, { AxiosInstance } from 'axios'

class SapClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.SAP_HOST,
      auth: {
        username: process.env.SAP_USER || '',
        password: process.env.SAP_PASSWORD || '',
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    // Interceptor para logs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('SAP API Error:', {
          status: error.response?.status,
          message: error.message,
        })
        return Promise.reject(error)
      }
    )
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(endpoint, { params })
    return response.data
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.post<T>(endpoint, data)
    return response.data
  }
}

export const sapClient = new SapClient()

export async function fetchFromSap(
  endpoint: string,
  params?: Record<string, any>
) {
  return sapClient.get(endpoint, params)
}
```

### 4. **Transformação de Dados**

```typescript
// lib/sap/transforms.ts
import type { SapOrder } from '@/lib/sap/useSapOrders'

export function transformSapOrder(sapData: any): SapOrder {
  const qtdPlanejada = parseFloat(sapData.PlannedQuantity || 0)
  const qtdExecutada = parseFloat(sapData.ExecutedQuantity || 0)

  return {
    id: sapData.ProductionOrder,
    numero: sapData.ProductionOrder,
    material: sapData.Material,
    centro: sapData.WorkCenter,
    dataInicio: new Date(sapData.ScheduledStartDate),
    dataFim: new Date(sapData.ScheduledEndDate),
    status: mapSapStatus(sapData.OrderStatus),
    qtdPlanejada,
    qtdExecutada,
    progresso: qtdPlanejada > 0 ? (qtdExecutada / qtdPlanejada) * 100 : 0,
  }
}

function mapSapStatus(sapStatus: string): SapOrder['status'] {
  const statusMap: Record<string, SapOrder['status']> = {
    RELEASED: 'RELEASED',
    STARTED: 'STARTED',
    COMPLETED: 'COMPLETED',
    CLOSED: 'COMPLETED',
    ARCHIVED: 'ARCHIVED',
  }
  return statusMap[sapStatus] || 'RELEASED'
}
```

---

## 💾 Cache e Performance

### Redis (Recomendado para produção)

```typescript
// lib/sap/cache.ts
import { redis } from '@/lib/redis'

const CACHE_TTL = 5 * 60 // 5 minutos

export async function getCachedOrdens() {
  const cached = await redis.get('sap:orders')
  if (cached) {
    return JSON.parse(cached)
  }

  const data = await fetchFromSap('/sap/opu/odata/sap/C_PRODUCTIONORDER_SRV/C_ProductionOrder')
  await redis.setex('sap:orders', CACHE_TTL, JSON.stringify(data))
  return data
}

export async function invalidateCache() {
  await redis.del('sap:orders')
}
```

### Em Memória (Desenvolvimento)

```typescript
// lib/sap/cache-memory.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private ttl = 5 * 60 * 1000 // 5 minutos

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const memoryCache = new MemoryCache()
```

---

## ⚠️ Tratamento de Erros

```typescript
// lib/sap/errors.ts
export class SapError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'SapError'
  }
}

export class SapAuthenticationError extends SapError {
  constructor(message = 'Falha na autenticação com SAP') {
    super('AUTH_ERROR', message, 401)
  }
}

export class SapConnectionError extends SapError {
  constructor(message = 'Erro ao conectar com SAP') {
    super('CONNECTION_ERROR', message, 503)
  }
}

export class SapDataError extends SapError {
  constructor(message = 'Erro ao processar dados do SAP') {
    super('DATA_ERROR', message, 500)
  }
}
```

---

## 📝 Exemplo Prático

### Componente que consome dados do SAP

```typescript
// components/ordensFromSap.tsx
'use client'

import { useSapOrders } from '@/lib/sap/useSapOrders'
import { DataTable } from '@/components/ui/data-table'
import { Loader2, AlertCircle } from 'lucide-react'

export function OrdensFromSap() {
  const { orders, loading, error, refetch } = useSapOrders()

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4">
        <Loader2 className="size-4 animate-spin" />
        Carregando ordens do SAP...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
        <button
          onClick={refetch}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ordens de Produção (SAP)</h2>
        <button
          onClick={refetch}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Atualizar
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'numero', label: 'Ordem' },
          { key: 'material', label: 'Material' },
          { key: 'centro', label: 'Centro' },
          { key: 'qtdExecutada', label: 'Executado' },
          { key: 'progresso', label: 'Progresso', format: (v) => `${v.toFixed(1)}%` },
        ]}
        data={orders}
      />
    </div>
  )
}
```

---

## 🔧 Configuração no package.json

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/redis": "^4.0.0"
  }
}
```

---

## 🚀 Checklist de Implementação

- [ ] Configurar variáveis de ambiente (.env.local)
- [ ] Criar cliente SAP com autenticação
- [ ] Implementar endpoints API (/api/sap/*)
- [ ] Adicionar cache (Redis ou memória)
- [ ] Criar hooks React para consumir dados
- [ ] Implementar tratamento de erros
- [ ] Adicionar logging
- [ ] Testes unitários
- [ ] Testes de integração com SAP (staging)
- [ ] Monitoramento em produção

---

## 📚 Referências

- [SAP OData Documentation](https://www.odata.org/)
- [SAP REST API Documentation](https://help.sap.com/doc/api)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Axios Documentation](https://axios-http.com/)

