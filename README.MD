# Central de Eventos SCMJF

Sistema da Santa Casa de Misericórdia para gestão de eventos, categorias e inscrições, com backend Java/Spring Boot integrado ao Oracle e um frontend web moderno preparado para operação no servidor institucional.

## Estrutura principal

```text
.
├── backend/   -> API REST Spring Boot + Oracle
├── frontend/  -> aplicação oficial Next.js para produção
├── app/       -> protótipo estático legado
├── index.html -> entrada antiga do protótipo estático
└── README.MD
```

## Módulos

### `backend/`

API REST Java 17 com Spring Boot, Spring Data JPA e Oracle.

Endpoints principais:

- `POST /eventos`
- `GET /eventos`
- `GET /eventos/{id}`
- `POST /categorias`
- `GET /categorias/evento/{eventoId}`
- `POST /inscricoes`
- `DELETE /inscricoes/{id}`
- `GET /inscricoes/evento/{eventoId}`

Regras de negócio já implementadas:

- bloqueio de inscrição em evento inativo
- bloqueio de inscrição em categoria inativa
- bloqueio de categoria lotada por contagem real na tabela `INSCRICAO`
- bloqueio de duplicidade por matrícula + categoria
- geração de logs em `LOG_EVENTOS`

### `frontend/`

Frontend oficial em Next.js com App Router, preparado para rodar em Node na porta `3000`.

Características:

- dashboard de eventos com categorias dentro do card do evento
- tela administrativa para cadastro de eventos e categorias
- tela de inscrições com bloqueios visuais conforme as regras da API
- proxy interno para o backend Spring, evitando dependência de CORS no navegador
- scripts de execução para ambiente de servidor

### `app/`

Protótipo estático anterior, mantido como referência histórica. O fluxo produtivo deve considerar `frontend/` como a aplicação principal.

## Deploy recomendado

### Backend

Executar a API Spring Boot no mesmo servidor, normalmente em `http://127.0.0.1:8080`.

### Frontend

Dentro de `frontend/`:

```bash
npm install
npm run build
npm run start
```

O script `start` já sobe o Next.js em `0.0.0.0:3000`.

Também existe um arquivo `frontend/ecosystem.config.cjs` para uso com PM2.

## Observações

- O frontend oficial consome os contratos reais da API, não mais `localStorage`.
- O modelo está preparado para evolução futura com autenticação, módulos extras e novas rotas.
- Para instruções detalhadas do frontend, consulte [frontend/README.md](./frontend/README.md).
