# Frontend da Central de Eventos

Aplicacao oficial da Central de Eventos da Santa Casa, construida em Next.js para consumir a API Java/Spring Boot do projeto.

## Objetivo

Rodar em producao no servidor `172.18.2.246`, escutando na porta `3000`, enquanto o backend atende na porta `8080`.

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

1. o usuario acessa o frontend em `http://172.18.2.246:3000`
2. o Next.js expoe rotas internas em `src/app/api/`
3. as rotas internas fazem o proxy para o backend Spring Boot
4. a interface recebe os dados ja normalizados

Essa abordagem evita dependencia de configuracao de CORS entre as portas `3000` e `8080`.

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
BACKEND_API_BASE_URL=http://127.0.0.1:8080
FRONTEND_SESSION_SECRET=defina-uma-chave-longa-e-exclusiva-para-o-frontend
```

Importante:

- `BACKEND_API_BASE_URL` define para onde o proxy do frontend envia as requisicoes
- `FRONTEND_SESSION_SECRET` assina a sessao HTTP-only do usuario

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

Aplicacao disponivel em `http://localhost:3000`.

## Build para servidor

```bash
npm install
npm run build
npm run start
```

O script `start` sobe a aplicacao em `0.0.0.0:3000`.

## PM2

O projeto inclui `ecosystem.config.cjs`.

Exemplo:

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

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
