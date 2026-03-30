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

1. Abra o arquivo `index.html` no navegador para acessar o dashboard do sistema.
2. Use `cadastro.html` para registrar novos eventos e categorias.
3. Use `inscricoes.html` para selecionar uma categoria e concluir a inscricao do participante.
4. Volte ao dashboard sempre que quiser acompanhar a visao geral dos eventos e indicadores.

## Estrutura

- `index.html`: dashboard do sistema com indicadores, atalhos e cards dos eventos.
- `cadastro.html`: tela administrativa para cadastrar eventos e categorias.
- `inscricoes.html`: tela dedicada para selecionar categorias e registrar inscricoes.
- `styles.css`: identidade visual, responsividade e animacoes.
- `app.js`: regras de negocio, renderizacao, persistencia e interacoes compartilhadas entre as tres telas.

## Observacoes

- Os dados ficam salvos apenas no navegador onde a aplicacao foi utilizada.
- Para uso em producao multiusuario, o proximo passo ideal e ligar essa interface a uma API e banco de dados.
