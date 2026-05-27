# Frontend da Central de Eventos

Aplicacao oficial da Central de Eventos da Santa Casa, construida em Next.js para consumir a API Java/Spring Boot do projeto.

## Objetivo

Rodar em producao em servidor Linux, escutando na porta `4006`, enquanto o backend atende na porta `8006`.

## Arquitetura

- `src/app/`
  Rotas da aplicacao e rotas internas de proxy.
- `src/components/`
  Componentes das telas de dashboard, cadastros, inscricoes e autenticacao.
- `src/lib/`
  Integracao com a API, sessao autenticada e utilitarios.
- `src/types/`
  Tipos TypeScript alinhados aos DTOs da API Java.

## Como a integracao funciona

O navegador nao chama a API Java diretamente.

Fluxo:

1. o usuario acessa o frontend em `http://SEU_IP_OU_DOMINIO:4006`
2. o Next.js expoe rotas internas em `src/app/api/`
3. as rotas internas fazem o proxy para o backend Spring Boot
4. a interface recebe os dados ja normalizados

Essa abordagem evita dependencia de configuracao de CORS entre as portas `4006` e `8006`.

## Pre-requisitos

- Node.js `20.9+`
- npm
- backend Spring Boot disponivel

## Variaveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Conteudo esperado:

```env
HOSTNAME=0.0.0.0
PORT=4006
BACKEND_API_BASE_URL=http://127.0.0.1:8006
FRONTEND_SESSION_SECRET=defina-uma-chave-longa-e-exclusiva-para-o-frontend
FRONTEND_SESSION_SECURE=false
```

Importante:

- `HOSTNAME=0.0.0.0` faz o Next.js escutar em todas as interfaces do servidor
- `PORT=4006` define a porta publica do frontend
- `BACKEND_API_BASE_URL` define para onde o proxy do frontend envia as requisicoes
- `FRONTEND_SESSION_SECRET` assina a sessao HTTP-only do usuario
- `FRONTEND_SESSION_SECURE=false` deve ser usado quando o acesso ao frontend for via `http://` interno sem HTTPS

## Execucao local

Suba primeiro o backend:

```bash
cd ../backend
mvn spring-boot:run
```

Depois, em outro terminal:

```bash
npm install
npm run dev
```

Aplicacao disponivel em `http://localhost:4006`.

## Build para servidor

```bash
npm install
npm run build
npm run start
```

O script `start` sobe a aplicacao em `0.0.0.0:4006`.

## Subida no servidor Linux

Use `.env.local` com:

```env
HOSTNAME=0.0.0.0
PORT=4006
BACKEND_API_BASE_URL=http://127.0.0.1:8006
FRONTEND_SESSION_SECRET=defina-uma-chave-longa-e-exclusiva-para-o-frontend
FRONTEND_SESSION_SECURE=false
```

Depois rode:

```bash
npm ci
chmod +x start-server.sh
./start-server.sh
```

O script faz o build e sobe o frontend em `0.0.0.0:4006`.

## PM2

O projeto inclui `ecosystem.config.cjs`.

Exemplo:

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

O `ecosystem.config.cjs` ja esta preparado para:

- `HOSTNAME=0.0.0.0`
- `PORT=4006`
- `BACKEND_API_BASE_URL=http://127.0.0.1:8006`

## Telas implementadas

### `/dashboard`

- lista de eventos vindos da API
- categorias dentro do card do evento
- eventos internos ocultos para usuarios externos
- atalhos para inscricao e gestao conforme o perfil

### `/cadastros`

- cadastro e edicao de eventos do administrador criador
- cadastro e edicao de categorias
- listagem administrativa com participantes inscritos
- cancelamento administrativo de inscricoes

### `/inscricoes`

- listagem de categorias agrupadas por evento
- selecao visual da categoria
- formulario de inscricao com dados do usuario autenticado
- bloqueios automaticos conforme regras da API

### `/login`, `/cadastro-externo`, `/recuperar-senha`, `/redefinir-senha`

- autenticacao interna por matricula MV
- autenticacao externa por e-mail e senha
- recuperacao de senha para usuario externo
- sessao segura via cookies HTTP-only
