# Progresso - 2026-04-28

Base de retomada: `docs/progresso-2026-04-25.md`

## Contexto recuperado

- A retomada partiu dos itens anotados para 27/04/2026 no ultimo registro.
- O fluxo de avaliacoes do professor ja existia com criacao, edicao, exclusao e montagem de questoes.
- Faltava publicar as avaliacoes para o acesso do aluno e ajustar alguns pontos de interface pedidos durante a revisao.

## Implementado nesta retomada

- Corrigido o fluxo de alternativa correta das questoes objetivas para preservar exatamente uma alternativa marcada como correta.
- Na tela do professor em `Avaliacoes`, foi removido o botao duplicado `Criar avaliacao` de dentro da tabela.
- A tela do professor manteve apenas o botao superior `Adicionar nova avaliacao` como entrada para criacao.
- O acesso do aluno ganhou o botao global `REALIZAR AVALIACAO` na topbar.
- No acesso do aluno, os atalhos `MEUS CURSOS` e `REALIZAR AVALIACAO` foram centralizados na topbar.
- Os atalhos da topbar do aluno passaram a renderizar texto em maiusculas via CSS.
- Criado o fluxo de avaliacoes publicadas para o aluno no frontend.
- O aluno agora consegue listar avaliacoes publicadas pelos professores para turmas em que possui matricula aprovada.
- O aluno consegue abrir uma avaliacao, responder questoes objetivas ou discursivas e enviar as respostas.
- O backend ganhou DTOs especificos para avaliacoes do aluno em `DTOs/AvaliacaoAlunoDtos.cs`.
- `IAvaliacaoService` e `AvaliacaoService` passaram a expor listagem de avaliacoes por aluno, listagem de questoes sem revelar alternativa correta e envio de respostas.
- `AvaliacoesController` ganhou endpoints para o fluxo do aluno:
  - `GET /api/Avaliacoes/aluno/{alunoId}`
  - `GET /api/Avaliacoes/{id}/aluno/questoes`
  - `POST /api/Avaliacoes/{id}/aluno/respostas`
- O modo demo passou a espelhar o fluxo de avaliacoes do aluno, incluindo listagem, questoes e envio de respostas.
- O modo demo agora garante uma avaliacao publicada de apresentacao mesmo quando o navegador ja possui uma base antiga salva no `localStorage`.
- A avaliacao demo de apresentacao fica publicada, sem data de fechamento e com tentativas suficientes para demonstracao.
- Na aba administrativa `Alunos`, a tabela foi reorganizada para:
  `MATRICULA | NOME | EMAIL | CURSOS CADASTRADOS | STATUS`.
- A coluna `MATRICULA` da aba `Alunos` usa fallback para o `codigoRegistro` das matriculas quando o cadastro do aluno nao traz a matricula diretamente.

## Validacao

- Frontend compilado com sucesso apos remover o botao duplicado de criacao de avaliacao:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Backend compilado com sucesso apos criar o fluxo de avaliacoes do aluno:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Frontend compilado com sucesso apos adicionar o fluxo de avaliacoes do aluno:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Frontend compilado com sucesso apos centralizar os atalhos da topbar do aluno e deixar o texto em maiusculas.
- Frontend compilado com sucesso apos garantir a avaliacao demo de apresentacao.
- Frontend compilado com sucesso apos reorganizar a tabela administrativa de `Alunos`.

## Proximos pontos sugeridos

- Revisar visualmente no navegador o fluxo completo do aluno: `MEUS CURSOS`, `REALIZAR AVALIACAO`, abertura da avaliacao e envio de respostas.
- Avaliar se as descricoes visuais em cards e secoes devem ser removidas ou escondidas em telas operacionais para reduzir poluicao da interface.
- Continuar o item pendente de tornar a tabela `MEUS CURSOS` clicavel/expansivel para exibir os modulos do curso.
