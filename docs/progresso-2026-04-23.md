# Progresso - 2026-04-23

Base de retomada: `docs/progresso-2026-04-22.md`

## Contexto recuperado

- O fluxo de progresso do aluno ja estava implementado e validado na retomada anterior.
- As telas de `Turmas`, `Professores` e `Alunos` ja tinham sido padronizadas com busca, filtros e contagem.
- `SecaoModulos.jsx` ainda estava no padrao antigo, sem barra de filtros no mesmo nivel das outras tabelas administrativas.

## Implementado nesta retomada

- `frontend/src/pages/workspace/SecaoModulos.jsx` agora tem busca textual sem acento, filtro por curso, botao `Limpar filtros` e resumo no formato `X de Y modulos`.
- A selecao em lote da tela de modulos passou a respeitar apenas o conjunto atualmente visivel, evitando editar ou excluir itens escondidos por filtros.
- A mensagem vazia da tabela agora diferencia ausencia real de dados e resultado vazio por filtro aplicado.
- Foram adicionados comentarios curtos nas partes e funcoes principais de `SecaoModulos.jsx` para facilitar futuras manutencoes.
- `frontend/src/pages/workspace/SecaoTurmas.jsx` passou a mostrar a quantidade de alunos aprovados por turma na tabela, no lugar da antiga coluna de data de criacao.
- `frontend/src/pages/workspace/SecaoTurmas.jsx` agora tambem possui o botao `Criar turma`, abrindo um popup com `Nome da turma`, `Curso` e `Professor responsavel`, integrado ao `POST /Turmas`.
- `frontend/src/lib/demoApi.js` passou a espelhar a criacao de turmas em modo demo para manter o mesmo fluxo do ambiente real.
- `frontend/src/pages/workspace/SecaoMatriculas.jsx` passou a ocultar a coluna `Nota` em todas as tres abas do gestor (`Pendentes`, `Aprovadas` e `Rejeitadas`).
- `frontend/src/pages/workspace/SecaoAlunos.jsx` passou a trocar `CPF` e `Cidade` por `Matricula` e `Cursos cadastrados`, contando cursos distintos por aluno a partir das matriculas carregadas no painel.
- `frontend/src/pages/workspace/SecaoCursos.jsx` passou a resumir cada curso como hub do fluxo academico, exibindo contagens de `Modulos`, `Turmas` e `Matriculas`, alem de botoes `Ver modulos` e `Ver turmas` por linha.
- `frontend/src/pages/workspace/SecaoCursos.jsx` deixou de exibir a coluna `Preco` na tabela de cursos, mantendo o foco da grade em estrutura academica e operacao.
- `frontend/src/pages/WorkspaceScreen.jsx`, `frontend/src/pages/workspace/SecaoModulos.jsx` e `frontend/src/pages/workspace/SecaoTurmas.jsx` agora compartilham um contexto simples de curso em foco, abrindo `Modulos` e `Turmas` ja filtrados pelo curso escolhido na tela de `Cursos`.
- `Data/DevelopmentDataSeeder.cs` foi ajustado para prever 5 alunos de teste pendentes na tela de `Matriculas`, usando `Aluno Teste 01` ate `Aluno Teste 05`.
- `Data/DevelopmentDataSeeder.cs` agora gera mais 20 alunos de teste em desenvolvimento, de forma idempotente e sem duplicar por e-mail.
- `Data/DevelopmentDataSeeder.cs` tambem passou a gerar mais 5 coordenadores, 5 professores, 5 cursos e 5 modulos de teste em desenvolvimento, com cursos distribuidos entre os novos coordenadores.
- `frontend/src/pages/workspace/SecaoMatriculas.jsx` ganhou a aba `Rejeitadas` ao lado de `Pendentes` e `Aprovadas`, reaproveitando as matriculas ja retornadas pelo snapshot do gestor.

## Validacao

- Frontend compilado com sucesso usando o Node empacotado:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Nova validacao do frontend apos a aba `Rejeitadas` tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos a troca da coluna de `Turmas` para quantidade de alunos tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos o popup `Criar turma` tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos trocar as colunas da tabela de `Alunos` tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos remover a coluna `Nota` das abas de `Matriculas` tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos transformar `Cursos` no ponto de partida para `Modulos` e `Turmas` tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos remover a coluna `Preco` da tabela de `Cursos` tambem executou com sucesso usando o mesmo comando.
- Backend compilado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Seed de desenvolvimento executado no LocalDB durante a inicializacao da API; consulta posterior confirmou `21` alunos no banco (`1` demo + `20` de teste).
- Nova execucao do seed confirmou exatamente `5` coordenadores de teste, `5` professores de teste, `5` cursos de teste e `5` modulos de teste; os totais atuais do banco ficaram em `6` coordenadores, `6` professores, `21` alunos, `11` cursos e `10` modulos.
- Atualizacao direta no LocalDB deixou `5` matriculas pendentes visiveis para `Aluno Teste 01` ate `Aluno Teste 05`.
- Durante o ajuste dos 5 pendentes, a revalidacao do backend encontrou um problema preexistente de build com arquivos gerados duplicados em `obj` e tambem bloqueio do binario `Release`; por isso a confirmacao final dessa parte foi feita diretamente no LocalDB.

## Proximo passo sugerido

- Padronizar `frontend/src/pages/workspace/SecaoConteudosProfessor.jsx` com a mesma barra de busca, filtros e contagem, pois hoje ela segue como a principal tabela operacional sem o toolbar unificado.
