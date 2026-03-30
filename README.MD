# Central de Eventos SCMJF

Aplicação web da Santa Casa de Misericórdia criada para registrar eventos, cadastrar categorias dentro de cada evento e permitir inscrições de participantes por categoria.

## O que a aplicação faz

- Cadastra eventos com nome, data/hora de início e fim, matrícula do responsável e setor responsável.
- Permite adicionar quantas categorias forem necessárias dentro de cada evento.
- Controla vagas por categoria e exibe se a categoria aceita inscrições externas.
- Registra inscrições com matrícula, setor e contato.
- Mostra cards modernos dos eventos com suas respectivas categorias no mesmo bloco.
- Salva os dados no navegador com `localStorage`, sem depender de backend.

## Como usar

1. Abra o arquivo `index.html` da raiz para entrar no diretório principal da aplicação.
2. O ponto de entrada redireciona automaticamente para `app/pages/dashboard/`.
3. Use `app/pages/cadastros/` para registrar novos eventos e categorias.
4. Use `app/pages/inscricoes/` para selecionar uma categoria e concluir a inscrição do participante.

## Estrutura profissional da aplicação

```text
.
├── app/
│   ├── assets/
│   │   ├── scripts/
│   │   │   └── app.js
│   │   └── styles/
│   │       └── main.css
│   ├── modules/
│   ├── pages/
│   │   ├── cadastros/
│   │   │   └── index.html
│   │   ├── dashboard/
│   │   │   └── index.html
│   │   └── inscricoes/
│   │       └── index.html
│   ├── services/
│   └── shared/
├── index.html
└── README.MD
```

## Critério da reorganização

- `app/pages/`: concentra as telas da aplicação e prepara o projeto para evoluir para rotas mais robustas.
- `app/assets/`: centraliza CSS e JavaScript compartilhados.
- `app/modules/`: reservado para futuros módulos de domínio, como eventos, categorias, usuários e inscrições.
- `app/services/`: reservado para integrações futuras com API, autenticação e camada de dados.
- `app/shared/`: reservado para utilitários, componentes reutilizáveis e contratos comuns.
- `index.html` na raiz: funciona como porta de entrada estável do projeto e redireciona para o dashboard.

## Observações

- Os dados ainda ficam salvos apenas no navegador onde a aplicação foi utilizada.
- Para uso em produção multiusuário, o próximo passo ideal é ligar essa interface a uma API e banco de dados.
