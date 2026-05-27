# Central de Eventos SCMJF

Sistema da Santa Casa de Misericordia para gestao de eventos, categorias e inscricoes, com backend Java/Spring Boot integrado ao Oracle e frontend Next.js preparado para operacao institucional.

## Estrutura principal

```text
.
|-- backend/   -> API REST Spring Boot + Oracle
|-- frontend/  -> aplicacao oficial Next.js para producao
|-- app/       -> prototipo estatico legado
|-- index.html -> entrada antiga do prototipo estatico
`-- README.MD
```

## Modulos

### `backend/`

API REST Java 17 com Spring Boot, Spring Data JPA e Oracle.

Endpoints principais:

- `POST /eventos`
- `GET /eventos`
- `GET /eventos/{id}`
- `POST /categorias`
- `PUT /categorias/{id}`
- `GET /categorias/evento/{eventoId}`
- `POST /inscricoes`
- `DELETE /inscricoes/{id}`
- `GET /inscricoes/evento/{eventoId}`
- `POST /usuarios-internos/login`
- `POST /usuarios-externos`
- `POST /usuarios-externos/login`
- `POST /usuarios-externos/recuperacao-senha/solicitar`
- `POST /usuarios-externos/recuperacao-senha/validar`
- `POST /usuarios-externos/recuperacao-senha/redefinir`

Regras principais:

- bloqueio de inscricao em evento inativo
- bloqueio de inscricao em categoria inativa
- bloqueio de categoria lotada por contagem real na tabela `INSCRICAO`
- bloqueio de duplicidade por matricula + categoria
- posse do evento vinculada ao criador do evento
- autenticacao interna por matricula MV
- autenticacao externa por e-mail e senha com hash
- sessao autenticada por bearer token assinado
- rate limit basico para login

### `frontend/`

Frontend oficial em Next.js com App Router, rodando em Node na porta `4006`.

Caracteristicas:

- dashboard de eventos com categorias no card do evento
- area administrativa para eventos e categorias do criador logado
- tela de inscricoes com regras visuais de disponibilidade
- proxy interno para o backend Spring
- sessao assinada em cookie HTTP-only

### `app/`

Prototipo estatico legado, mantido apenas como referencia historica.

## Execucao local

### Backend

```bash
cd backend
mvn spring-boot:run
```

Por padrao, a API sobe em `0.0.0.0:8006`.

### Frontend

```bash
cd frontend
npm install
npm run build
npm run start
```

O frontend sobe em `0.0.0.0:4006`.

## Publicacao em servidor Linux

Estrutura esperada no servidor:

- API Java em `http://SEU_IP_OU_DOMINIO:8006`
- Frontend Next.js em `http://SEU_IP_OU_DOMINIO:4006`

### Tecnologias necessarias no servidor

- Java 17 ou superior
- Maven 3.8+ para gerar o `.jar` da API
- Node.js 20.9+ e npm para build/start do frontend
- acesso de rede ao banco Oracle configurado em `backend/datasource-local.properties`
- PM2 ou systemd para manter os processos ativos em producao

### Backend

Dentro de `backend/`, crie:

- `datasource-local.properties`
- `auth-local.properties`
- `mail-local.properties`

Depois rode:

```bash
cd backend
cp datasource-local.example.properties datasource-local.properties
cp auth-local.example.properties auth-local.properties
cp mail-local.example.properties mail-local.properties
nano datasource-local.properties
nano auth-local.properties
nano mail-local.properties
chmod +x start-server.sh
FRONTEND_BASE_URL=http://SEU_IP_OU_DOMINIO:4006 ./start-server.sh
```

O script gera o `.jar` se necessario e sobe a API em `0.0.0.0:8006`.

### Frontend

Dentro de `frontend/`, crie `.env.local` com base em `.env.example`.

Depois rode:

```bash
cd frontend
npm ci
cp .env.example .env.local
nano .env.local
chmod +x start-server.sh
./start-server.sh
```

O `.env.local` deve apontar para a API:

```env
HOSTNAME=0.0.0.0
PORT=4006
BACKEND_API_BASE_URL=http://127.0.0.1:8006
FRONTEND_SESSION_SECRET=defina-uma-chave-longa-e-exclusiva-para-o-frontend
FRONTEND_SESSION_SECURE=false
```

### PM2 para o frontend

O arquivo `frontend/ecosystem.config.cjs` ja esta alinhado para:

- `HOSTNAME=0.0.0.0`
- `PORT=4006`
- `BACKEND_API_BASE_URL=http://127.0.0.1:8006`

Exemplo:

```bash
cd frontend
export FRONTEND_SESSION_SECRET=defina-uma-chave-longa-e-exclusiva-para-o-frontend
pm2 start ecosystem.config.cjs
pm2 save
```

## Configuracao segura

### Backend

Nao grave credenciais reais no `application.properties`.

Crie arquivos locais nao versionados dentro de `backend/`:

- `datasource-local.properties`
- `auth-local.properties`
- `mail-local.properties`

Modelos disponiveis:

- `backend/datasource-local.example.properties`
- `backend/auth-local.example.properties`
- `backend/mail-local.example.properties`

Esses arquivos sao carregados automaticamente por `spring.config.import`.

### Frontend

Copie `frontend/.env.example` para `frontend/.env.local` e preencha:

- `HOSTNAME`
- `PORT`
- `BACKEND_API_BASE_URL`
- `FRONTEND_SESSION_SECRET`

O `FRONTEND_SESSION_SECRET` deve ser uma chave longa e exclusiva para assinar a sessao do frontend.

## Observacoes

- o frontend oficial consome os contratos reais da API
- o frontend usa sessao assinada em cookie HTTP-only
- a API usa bearer token assinado para rotas protegidas
- o prototipo estatico em `app/` nao deve ser tratado como versao produtiva
- para detalhes do frontend, consulte [frontend/README.md](./frontend/README.md)
