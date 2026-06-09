# Guia Completo de Setup - Integração SAP SE16N

## 🎯 Objetivo

Este guia orienta o setup completo do projeto para integração com API SAP usando a transação SE16N.

---

## ✅ Pré-requisitos

### Ambiente
- **Node.js** 20.x ou superior
- **pnpm** 9.x ou superior
- **Git** 2.30+

### SAP
- Credenciais de acesso (username, password)
- URL do gateway/servidor SAP
- Client ID (ex: 100)
- Permissões em tabelas: AUFK, AFPO, MARD, MSEG, MAKT
- Acesso à transação SE16N

### Rede
- Acesso ao servidor SAP
- Firewall liberado para porta SAP (ex: 8000, 8001)
- Certificado SSL válido (se HTTPS)

---

## 🚀 Passo 1: Setup Inicial

### 1.1 Clone o Repositório

```bash
git clone https://github.com/EriFranca/dashboard_ordens.git
cd dashboard_ordens
```

### 1.2 Instale Dependências

```bash
# Com pnpm (recomendado)
pnpm install

# Ou com npm
npm install

# Verificar instalação
node --version  # v20+
pnpm --version  # 9+
```

### 1.3 Verifique o Build

```bash
pnpm run build
# Deve gerar .next/ sem erros
```

---

## 🌍 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Criar `.env.local`

```bash
cp .env.example .env.local
```

### 2.2 Editar Variáveis

**Arquivo:** `.env.local`

```bash
# ========== SAP Configuration ==========
# URL completa do SAP (com protocolo e porta)
NEXT_PUBLIC_SAP_URL=https://sap.company.com:8000

# Credenciais (armazenar com segurança!)
SAP_API_USER=seu_usuario_sap
SAP_API_PASSWORD=sua_senha_segura

# Cliente e idioma
SAP_CLIENT=100
SAP_LANGUAGE=PT

# ========== Cache Configuration ==========
# TTL em millisegundos
CACHE_TTL_ORDERS=300000         # 5 minutos
CACHE_TTL_MATERIALS=900000      # 15 minutos
CACHE_TTL_STOCK=600000          # 10 minutos

# Habilitar/desabilitar cache
CACHE_ENABLED=true

# Persistência em IndexedDB
CACHE_PERSIST=true

# ========== API Configuration ==========
# Timeout para requisições (ms)
API_TIMEOUT=30000

# Retry em caso de erro
API_RETRY_ATTEMPTS=3
API_RETRY_DELAY=1000

# ========== Logging ==========
# Nível: debug, info, warn, error
LOG_LEVEL=info
LOG_FORMAT=json
```

### 2.3 Validar Configuração

```bash
# Verificar se .env.local foi criado
ls -la .env.local

# Verificar se não foi commitado
git status
# Deve mostrar .env.local em Ignored files

# Adicionar ao .gitignore se necessário
echo ".env.local" >> .gitignore
```

---

## 🔌 Passo 3: Testar Conexão SAP

### 3.1 Teste Básico via cURL

```bash
# Substituir valores entre <>
curl -X GET \
  "https://<seu-sap-server>:8000/sap/opu/odata" \
  -H "Authorization: Basic $(echo -n '<usuario>:<senha>' | base64)" \
  -v
```

**Resposta esperada:** 200 OK ou 404 (que significa servidor respondeu)

### 3.2 Teste via Node.js

```bash
# Criar arquivo test-connection.js
cat > test-connection.js << 'EOF'
const https = require('https');

const options = {
  hostname: process.env.NEXT_PUBLIC_SAP_URL.split('://')[1].split(':')[0],
  port: 8000,
  path: '/sap/opu/odata',
  method: 'GET',
  auth: `${process.env.SAP_API_USER}:${process.env.SAP_API_PASSWORD}`,
  rejectUnauthorized: false // Somente para teste!
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', () => {});
});

req.on('error', (error) => {
  console.error('Erro:', error.message);
});

req.end();
EOF

# Executar
node test-connection.js
```

---

## 📁 Passo 4: Criar Estrutura de Diretórios

```bash
# Criar diretórios principais
mkdir -p lib/services
mkdir -p lib/types
mkdir -p lib/api
mkdir -p lib/mappers
mkdir -p lib/hooks
mkdir -p lib/config

# Criar API routes
mkdir -p app/api/sap/{orders,materials,sync,health}
```

---

## 💾 Passo 5: Criar Tipos TypeScript Básicos

### Arquivo: `lib/types/sap.types.ts`

```typescript
/**
 * Tipos base para integração SAP
 */

// Status de uma ordem
export type OrderStatus = 
  | 'CREATED'
  | 'RELEASED'
  | 'INPROCESS'
  | 'COMPLETED'
  | 'DELETED';

// Interface de Ordem SAP
export interface SapOrder {
  orderId: string;
  description: string;
  status: OrderStatus;
  plannedStartDate: string;
  plannedEndDate: string;
  quantity: number;
  unit: string;
  plant: string;
  createdAt?: string;
  modifiedAt?: string;
}

// Interface de Material SAP
export interface SapMaterial {
  materialId: string;
  description: string;
  unit: string;
  quantity: number;
  reorderPoint: number;
  warehouse?: string;
}

// Resultado de sincronização
export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  duration: number;
  timestamp: string;
  errors?: string[];
}

// Status de sincronização
export interface SyncStatus {
  isRunning: boolean;
  lastSync?: string;
  nextSync?: string;
  progress: number;
  message?: string;
}

// Filtros para ordens
export interface OrderFilters {
  status?: OrderStatus;
  plant?: string;
  limit?: number;
  offset?: number;
}
```

---

## 🔧 Passo 6: Criar Cliente SAP Básico

### Arquivo: `lib/api/sap-client.ts`

```typescript
import { SapOrder, SapMaterial, OrderFilters } from '@/lib/types/sap.types';

export class SapClient {
  private baseUrl: string;
  private auth: string;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SAP_URL || '';
    const user = process.env.SAP_API_USER || '';
    const pass = process.env.SAP_API_PASSWORD || '';
    this.auth = Buffer.from(`${user}:${pass}`).toString('base64');
    this.timeout = parseInt(process.env.API_TIMEOUT || '30000');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`SAP API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getOrders(filters?: OrderFilters): Promise<SapOrder[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('$filter', `Status eq '${filters.status}'`);
    if (filters?.limit) params.append('$top', filters.limit.toString());
    
    return this.request(`/sap/opu/odata/sap/API_PURCHASE_ORDER_SRV?${params}`);
  }

  async getMaterials(plant?: string): Promise<SapMaterial[]> {
    const params = new URLSearchParams();
    if (plant) params.append('$filter', `Plant eq '${plant}'`);
    
    return this.request(`/sap/opu/odata/sap/API_MATERIAL_SRV?${params}`);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.request('/sap/opu/odata');
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## 🚀 Passo 7: Criar API Route Básica

### Arquivo: `app/api/sap/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { SapClient } from '@/lib/api/sap-client';

export async function GET() {
  try {
    const client = new SapClient();
    const isConnected = await client.verifyConnection();

    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      sapUrl: process.env.NEXT_PUBLIC_SAP_URL,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Passo 8: Testar a Integração

### 8.1 Iniciar Servidor Dev

```bash
pnpm run dev
```

Servidor deve estar disponível em `http://localhost:3000`

### 8.2 Testar Health Check

```bash
# Em outro terminal
curl http://localhost:3000/api/sap/health

# Resposta esperada:
# {
#   "status": "connected",
#   "timestamp": "2026-06-09T14:30:00Z",
#   "sapUrl": "https://sap.company.com:8000"
# }
```

### 8.3 Verificar Logs

```bash
# Verificar console do servidor dev
# Deve mostrar:
# - Requisição recebida
# - Tentativa de conexão SAP
# - Resultado (sucesso ou erro)
```

---

## 📊 Passo 9: Implementar Componentes Básicos

### Arquivo: `components/dashboard/SapConnectionStatus.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function SapConnectionStatus() {
  const [status, setStatus] = useState<string>('checking');
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/sap/health');
        const data = await response.json();
        setStatus(data.status);
        setLastCheck(new Date(data.timestamp).toLocaleString('pt-BR'));
      } catch (error) {
        setStatus('error');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, []);

  const statusColor = {
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    checking: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className={`p-4 rounded ${statusColor[status as keyof typeof statusColor]}`}>
      <p className="font-semibold">Status SAP: {status.toUpperCase()}</p>
      {lastCheck && <p className="text-sm">Última verificação: {lastCheck}</p>}
    </div>
  );
}
```

---

## ✨ Passo 10: Validação Final

### Checklist de Verificação

- [ ] `.env.local` criado e configurado
- [ ] Não commitado no git
- [ ] Node.js 20+ instalado
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Build sem erros (`pnpm run build`)
- [ ] Servidor dev inicia (`pnpm run dev`)
- [ ] Conexão SAP testada (`curl /api/sap/health`)
- [ ] Componente SapConnectionStatus funciona
- [ ] Console sem erros
- [ ] Cache funcionando (IndexedDB criado)

---

## 🐛 Troubleshooting

### Erro: "ECONNREFUSED"

```bash
# Verificar URL
echo $NEXT_PUBLIC_SAP_URL

# Testar conectividade
ping sap.company.com
telnet sap.company.com 8000
```

### Erro: "401 Unauthorized"

```bash
# Verificar credenciais
echo $SAP_API_USER
# Password não echo por segurança

# Testar com cURL
curl -u usuario:senha https://sap.company.com:8000/sap/opu/odata
```

### Erro: "Certificate Verification Failed"

```bash
# Opção 1: Dev only!
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run dev

# Opção 2: Adicionar certificado
export NODE_EXTRA_CA_CERTS=/path/to/cert.pem

# Opção 3: Usar certificado válido (prod)
```

---

## 📚 Próximos Passos

Após setup bem-sucedido:

1. ✅ Revisar [SAP_SE16N_INTEGRATION.md](./SAP_SE16N_INTEGRATION.md)
2. ✅ Estudar [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
3. ✅ Implementar serviços completos
4. ✅ Criar componentes React
5. ✅ Adicionar testes
6. ✅ Deploy em staging

---

## 📞 Suporte

Dúvidas?
- Consulte a [documentação completa](./README.md)
- Abra uma [issue no GitHub](https://github.com/EriFranca/dashboard_ordens/issues)
- Entre em contato: EriFranca

---

**Versão**: 1.0.0  
**Data**: 09/06/2026  
**Autor**: EriFranca
