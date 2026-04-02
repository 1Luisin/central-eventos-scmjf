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

Frontend oficial em Next.js com App Router, rodando em Node na porta `3000`.

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

Por padrao, a API sobe em `0.0.0.0:8080`.

### Frontend

```bash
cd frontend
npm install
npm run build
npm run start
```

O frontend sobe em `0.0.0.0:3000`.

## Publicacao no servidor 172.18.2.246

Estrutura esperada no servidor:

- API Java em `http://172.18.2.246:8080`
- Frontend Next.js em `http://172.18.2.246:3000`

### Backend

Dentro de `backend/`, crie:

- `datasource-local.properties`
- `auth-local.properties`
- `mail-local.properties`

Depois rode:

```powershell
cd backend
.\start-server.ps1
```

O script gera o `.jar` se necessario e sobe a API.

### Frontend

Dentro de `frontend/`, crie `.env.local` com base em `.env.example`.

Depois rode:

```powershell
cd frontend
npm install
.\start-server.ps1
```

### PM2 para o frontend

O arquivo `frontend/ecosystem.config.cjs` ja esta alinhado para:

- `HOSTNAME=172.18.2.246`
- `PORT=3000`
- `BACKEND_API_BASE_URL=http://172.18.2.246:8080`

Exemplo:

```powershell
cd frontend
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

- `BACKEND_API_BASE_URL`
- `FRONTEND_SESSION_SECRET`

O `FRONTEND_SESSION_SECRET` deve ser uma chave longa e exclusiva para assinar a sessao do frontend.

## Observacoes

- o frontend oficial consome os contratos reais da API
- o frontend usa sessao assinada em cookie HTTP-only
- a API usa bearer token assinado para rotas protegidas
- o prototipo estatico em `app/` nao deve ser tratado como versao produtiva
- para detalhes do frontend, consulte [frontend/README.md](./frontend/README.md)
