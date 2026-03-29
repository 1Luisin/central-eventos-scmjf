# Central de Eventos SCMJF

Aplicacao web estatica para a Santa Casa de Misericordia, criada para registrar eventos, cadastrar categorias dentro de cada evento e permitir inscricoes dos participantes por categoria.

## O que a aplicacao faz

- Cadastra eventos com nome, data/hora de inicio e fim, matricula do responsavel e setor responsavel.
- Permite adicionar quantas categorias forem necessarias dentro de cada evento.
- Controla vagas por categoria e exibe se a categoria aceita inscricoes externas.
- Registra inscricoes com matricula, setor e contato.
- Mostra cards modernos dos eventos com suas respectivas categorias no mesmo bloco.
- Salva os dados no navegador com `localStorage`, sem depender de backend.

## Como usar

1. Abra o arquivo `index.html` no navegador para acessar o painel principal.
2. Use o link para `cadastro.html` quando precisar registrar um novo evento ou uma nova categoria.
3. Volte ao painel principal para acompanhar os cards e liberar inscricoes por categoria.
4. Na area de inscricoes, escolha a categoria desejada e conclua a inscricao.

## Estrutura

- `index.html`: painel principal com cards de eventos, categorias e inscricoes.
- `cadastro.html`: tela separada para cadastrar eventos e categorias.
- `styles.css`: identidade visual, responsividade e animacoes.
- `app.js`: regras de negocio, renderizacao, persistencia e interacoes compartilhadas entre as duas paginas.

## Observacoes

- Os dados ficam salvos apenas no navegador onde a aplicacao foi utilizada.
- Para uso em producao multiusuario, o proximo passo ideal e ligar essa interface a uma API e banco de dados.
