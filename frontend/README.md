# Frontend da Central de Eventos

Aplicação oficial da Central de Eventos da Santa Casa de Misericórdia, construída em Next.js para consumir a API Java/Spring Boot do projeto.

## Objetivo

Este frontend foi criado para operar em produção no servidor `172.18.2.246`, escutando na porta `3000`, enquanto o backend Spring Boot permanece atendendo a API na porta `8080`.

## Arquitetura

- `src/app/`
  Rotas da aplicação e rotas internas de proxy.
- `src/components/`
  Componentes das telas de dashboard, cadastros e inscrições.
- `src/lib/`
  Integração com a API, transformação de dados e utilitários.
- `src/types/`
  Tipos TypeScript alinhados aos DTOs da API Java.

## Como a integração funciona

O navegador não chama a API Java diretamente.

Em vez disso:

1. o usuário acessa o frontend em `http://172.18.2.246:3000`
2. o Next.js expõe rotas internas em `src/app/api/`
3. essas rotas internas fazem o proxy para o backend Spring Boot
4. a interface recebe os dados já normalizados

Essa abordagem evita dependência de configuração de CORS entre as portas `3000` e `8080`.

## Pré-requisitos

- Node.js `20.9+`
- npm
- backend Spring Boot disponível

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Conteúdo esperado:

```env
BACKEND_API_BASE_URL=http://127.0.0.1:8080
```

Se o frontend e o backend estiverem no mesmo servidor, esse valor costuma ser o mais indicado.

## Execução local

```bash
npm install
npm run dev
```

Aplicação disponível em:

```text
http://localhost:3000
```

## Build para servidor

```bash
npm install
npm run build
npm run start
```

O script `start` já sobe a aplicação em:

```text
0.0.0.0:3000
```

## Execução com PM2

O projeto já inclui `ecosystem.config.cjs`.

Exemplo:

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## Telas implementadas

### `/dashboard`

- lista de eventos vindos da API
- categorias dentro do card do evento
- status de evento ativo/inativo
- status de categoria disponível, lotada ou inativa
- atalhos para inscrição e gestão

### `/cadastros`

- cadastro de eventos com o contrato real da API
- cadastro de categorias vinculadas ao evento
- listagem administrativa com participantes inscritos
- cancelamento administrativo de inscrições

### `/inscricoes`

- listagem de categorias agrupadas por evento
- seleção visual da categoria
- formulário de inscrição
- bloqueios automáticos conforme regras da API

## Contratos respeitados no frontend

### Evento

- `nomeEvento`
- `dataHoraInicio`
- `dataHoraFim`
- `nomeResponsavel`
- `nomeSetor`
- `numeroContato`
- `ativo`
- `descricao`

### Categoria

- `eventoId`
- `nomeCategoria`
- `externo`
- `descricao`
- `ativo`
- `limiteInscricoes`

### Inscrição

- `eventoId`
- `categoriaId`
- `numeroContato`
- `nomeSetor`
- `nomeUsuario`
- `matricula`

## Regras refletidas na interface

- inscrição bloqueada quando o evento está inativo
- inscrição bloqueada quando a categoria está inativa
- inscrição bloqueada quando a categoria está lotada
- mensagens da API exibidas ao usuário em caso de erro
- listagem de inscritos concentrada somente na área administrativa
