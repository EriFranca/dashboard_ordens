# Dashboard de Ordens Planejadas

Monitor de análise e monitoramento de ordens planejadas de produção (SAP PP).

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 20+
- pnpm 9+

### Instalação

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📦 Build e Deploy

### Build Local
```bash
pnpm run build
```

### Deploy no GitHub Pages

O projeto está configurado para fazer deploy automático no GitHub Pages.

**URL de acesso:** `https://EriFranca.github.io/dashboard_ordens`

#### Passos para ativar:

1. Vá para as configurações do repositório
2. Acesse **Settings → Pages**
3. Em "Build and deployment":
   - **Source:** GitHub Actions
4. Crie um workflow ou o GitHub Pages usará automaticamente

## 🛠️ Stack Tecnológico

- **Next.js 16** - React Framework
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component Library
- **Recharts** - Data Visualization
- **Lucide React** - Icons

## 📁 Estrutura do Projeto

```
dashboard_ordens/
├── app/                    # Next.js App Router
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx           # Página principal
├── components/            # Componentes React
├── lib/                   # Utilitários
├── public/                # Arquivos estáticos
└── next.config.mjs        # Configuração Next.js
```

## ⚙️ Configuração para GitHub Pages

O arquivo `next.config.mjs` está configurado com:
- `output: 'export'` - Gera site estático (necessário para GitHub Pages)
- `basePath: '/dashboard_ordens'` - Caminho da aplicação
- `assetPrefix: '/dashboard_ordens/'` - Prefixo dos assets
- `trailingSlash: true` - URLs com barra final
- `images.unoptimized: true` - Desativa otimização de imagens

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|----------|
| `pnpm run dev` | Inicia servidor de desenvolvimento |
| `pnpm run build` | Build para produção (exporta para /out) |
| `pnpm run start` | Inicia servidor de produção |
| `pnpm run lint` | Verifica código com ESLint |

## 🔄 Workflow de Deploy

O repositório está pronto para usar GitHub Actions. Você pode adicionar um workflow em `.github/workflows/deploy.yml` para automatizar o build e deploy.

## 📄 Licença

Este projeto é privado.

## 👤 Autor

**EriFranca**
