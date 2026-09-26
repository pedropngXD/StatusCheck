# Status Check ⚡

> Painel moderno, performático e minimalista inspirado nas diretrizes do Apple Human Interface Guidelines para monitoramento de integridade e telemetria em tempo real dos principais serviços de Inteligência Artificial e plataformas de nuvem.

![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite&logoColor=white)
![Oxlint](https://img.shields.io/badge/Oxlint-passing-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 🧭 Visão Geral

O **Status Check** agrega o estado operacional e métricas de incidentes de 22 provedores essenciais para desenvolvedores modernos e engenheiros de IA em uma interface unificada.

Construído sem dependências visuais pesadas, o projeto prioriza tempos de carregamento instantâneos, baixa latência e consumo mínimo de recursos através de renderização otimizada no React 19 e CSS nativo com aceleração de hardware.

---

## ✨ Principais Funcionalidades

- **⚡ Telemetria em Tempo Real:** Atualização automática e silenciosa em segundo plano a cada 60 segundos com suporte a atualização manual sob demanda.
- **🔍 22 Provedores Monitorados:** Cobertura de provedores de IA de ponta (OpenAI, Claude, Perplexity, Cohere, etc.) e infraestrutura crítica de nuvem (AWS, Cloudflare, GitHub, Supabase, Vercel, etc.).
- **📊 Diagnóstico e Detalhes de Incidentes:** Modal detalhado com histórico de mensagens dos incidentes, severidade e decomposição individual de componentes com campo de busca em tempo real.
- **🎛️ Gerenciador de Presets Personalizados:** Crie, edite e alterne entre coleções personalizadas de serviços para acompanhar apenas as ferramentas do seu stack diário (persistido localmente via `localStorage`).
- **🔲 Visualizações Flexíveis:** Alterne entre os modos **Grade (Cards)** e **Lista (Linhas Compactas)** com persistência de preferência.
- **🌗 Design System Apple-like:** Modos Claro e Escuro nativos com detecção automática do tema do sistema operacional e transições suaves.
- **🚀 Otimizações de Alta Performance:**
  - **Zero Roundtrips de Imagens:** Inline unificado em base64 de todos os 22 logotipos diretamente no bundle via Vite (`assetsInlineLimit`), eliminando requisições HTTP adicionais.
  - **CORS Bypass Seguro:** Proxy de desenvolvimento embutido no Vite e Edge Serverless Function (`/api/status`) para produção na Vercel com cabeçalhos de Edge Cache (`s-maxage=30, stale-while-revalidate=60`).
  - **Decodificação Especial:** Suporte integrado a endpoints legados ou atípicos, como a decodificação de payloads UTF-16 BE da AWS.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Estilização:** CSS Moderno (Variáveis de Design Tokens, Glassmorphism, SF Pro Font Stack)
- **Linter:** [Oxlint](https://oxc.rs/) (linter ultrarrápido baseado em Rust)
- **Backend / Proxy:** Vercel Serverless Function (Node.js) & Vite Connect Middleware

---

## 📡 Serviços Monitorados

| Categoria | Provedores |
| :--- | :--- |
| **Inteligência Artificial** | OpenAI, OpenAI Codex, Claude (Anthropic), Perplexity AI, Cohere, Google Cloud (Gemini & Vertex AI), Hugging Face, Mistral AI, xAI (Grok) |
| **Desenvolvimento & Nuvem** | GitHub, GitLab, Cloudflare, Vercel, Supabase, Netlify, npm, Docker Hub, Stripe, Discord, Notion, Figma, AWS |

---

## 🚀 Começando

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18.0 ou superior)
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/statuscheck.git
cd statuscheck
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) no seu navegador. O proxy local embutido cuidará de todas as requisições de telemetria sem necessidade de configurações adicionais.

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento com HMR e proxy ativo |
| `npm run build` | Compila os assets minificados e otimizados para produção na pasta `dist/` |
| `npm run preview` | Executa uma prévia local da pasta `dist/` gerada pelo build |
| `npm run lint` | Executa o linter Oxlint com verificação instantânea de boas práticas |

---

## 📁 Estrutura do Projeto

```text
StatusCheck/
├── api/
│   └── status.js               # Serverless Function da Vercel (Edge Proxy CORS & Caching)
├── public/
│   └── favicon.ico             # Ícone do projeto
├── src/
│   ├── assets/
│   │   └── logos/              # Logos dos 22 serviços monitorados
│   ├── components/
│   │   ├── IncidentList/       # Modal de detalhes de incidentes e busca de componentes
│   │   ├── PresetManager/      # Gerenciador e editor de presets personalizados
│   │   ├── ServiceCard/        # Card da visualização em grade
│   │   ├── ServiceGrid/        # Container da grade de serviços
│   │   ├── ServiceRow/         # Linha da visualização em lista
│   │   ├── StatusBadge/        # Tag de status (Operational, Degraded, Outage, etc.)
│   │   ├── ThemeToggle/        # Alternador de tema Claro / Escuro
│   │   └── ViewToggle/         # Alternador de modo Grade / Lista
│   ├── hooks/
│   │   ├── useServiceStatus.js # Hook de orquestração de telemetria, cache e polling
│   │   └── useTheme.js         # Hook de persistência de tema
│   ├── lib/
│   │   ├── statusAdapters.js   # Normalizadores de resposta para diferentes APIs de status
│   │   └── statusProviders.js  # Definição e catálogo dos serviços monitorados
│   ├── pages/
│   │   └── DashboardPage.jsx   # Página principal do dashboard
│   ├── App.jsx                 # Componente raiz
│   ├── index.css               # Design tokens, variáveis CSS e resets globais
│   └── main.jsx                # Ponto de entrada da aplicação React
├── index.html                  # HTML base com meta tags de acessibilidade e tema
├── package.json                # Dependências e scripts do projeto
└── vite.config.js              # Configuração do Vite, dev proxy e inlining de assets
```

---

## ☁️ Deploy na Vercel

O projeto foi configurado com suporte nativo à [Vercel](https://vercel.com):

1. Conecte seu repositório Git ao painel da Vercel.
2. A Vercel detectará automaticamente o Vite como Framework Preset.
3. A pasta `api/` será implantada automaticamente como Serverless Functions sem necessidade de configuração adicional.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.
