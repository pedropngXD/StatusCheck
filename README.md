# Status Check

Dashboard de telemetria e monitoramento de integridade em tempo real para 22 serviços de IA e infraestrutura.

## Visão Geral

Interface unificada desenvolvida com React 19 e Vite para acompanhar o status operacional, componentes e incidentes de serviços essenciais de inteligência artificial e computação em nuvem.

## Funcionalidades

- **Telemetria em tempo real:** Atualização periódica a cada 60 segundos, botão de atualização manual e cache local para carregamento instantâneo.
- **22 serviços monitorados:** OpenAI, Claude, Perplexity, Cohere, GCP, Hugging Face, Mistral, xAI, AWS, Cloudflare, GitHub, GitLab, Vercel, Supabase, Stripe e outros.
- **Detalhes de incidentes:** Modal com histórico, nível de impacto e filtro de componentes em tempo real.
- **Presets customizados:** Criação, edição e persistência de listas personalizadas de serviços no `localStorage`.
- **Filtros por status:** Botões de filtro rápido (Monitores, Operacional, Degradado, Interrupção) com contadores sincronizados ao preset ativo.
- **Visualização flexível:** Alternância fluida entre modos de grade (cards) e lista (linhas compactas).
- **Otimizado para mobile:** Grade em 2 colunas, navegação horizontal de presets com setas indicadoras e modais adaptados.
- **Fundo estático:** Sem deslocamento horizontal da tela ao abrir modais (`scrollbar-gutter: stable`).
- **Tema claro e escuro:** Detecção automática do sistema e alternância manual.
- **Bypass de CORS:** Proxy de desenvolvimento embutido no Vite e Serverless Function na Vercel para produção.

## Serviços Monitorados

| Categoria | Provedores |
| :--- | :--- |
| Inteligência Artificial | OpenAI, OpenAI Codex, Claude (Anthropic), Perplexity AI, Cohere, Google Cloud (Gemini & Vertex AI), Hugging Face, Mistral AI, xAI (Grok) |
| Desenvolvimento & Nuvem | GitHub, GitLab, Cloudflare, Vercel, Supabase, Netlify, npm, Docker Hub, Stripe, Discord, Notion, Figma, AWS |

## Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor local
npm run dev

# Compilar para produção
npm run build

# Executar linter
npm run lint
```

## Estrutura do Projeto

```text
StatusCheck/
├── api/status.js           # Serverless Function da Vercel (Edge Proxy CORS)
├── public/                 # Assets estáticos
├── src/
│   ├── assets/logos/       # Ícones dos serviços
│   ├── components/         # Componentes de interface e modais
│   ├── hooks/              # Custom hooks (presets, status, tema, visualização)
│   ├── lib/                # Normalizadores de API e catálogo de serviços
│   ├── pages/              # DashboardPage e estilos principais
│   ├── App.jsx             # Componente raiz
│   ├── index.css           # Tokens de design e resets globais
│   └── main.jsx            # Ponto de entrada da aplicação
├── package.json
└── vite.config.js
```

## Deploy

Configurado para deploy imediato na [Vercel](https://vercel.com). A pasta `api/` é detectada e implantada automaticamente como Serverless Functions.

## Licença

MIT
