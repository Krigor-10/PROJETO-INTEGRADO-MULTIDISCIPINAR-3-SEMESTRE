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
- `Professor` passou a ter `CodigoRegistro` publico persistido, com prefixo `PROF`, para nao expor o `Id` interno do banco na interface.
- A aba administrativa `Professores` agora exibe a coluna `MATRICULA` usando o `CodigoRegistro` do professor.
- O cadastro real de professor passou a gerar `CodigoRegistro` automaticamente.
- O seed de desenvolvimento e o modo demo passaram a garantir `codigoRegistro` para professores existentes e novos.
- Criada a migration `AdicionarCodigoRegistroProfessor`, preenchendo codigos para professores ja existentes antes de criar o indice unico filtrado.
- Na aba administrativa `Alunos`, a coluna `CURSOS CADASTRADOS` passou a mostrar o primeiro curso e um botao `+` quando houver mais cursos, abrindo um popup com a lista completa.
- Na aba administrativa `Professores`, foi adicionada a coluna `STATUS` com indicacao visual de professor ativo ou inativo.
- `Turma` passou a ter `CodigoRegistro` publico persistido, com prefixo `TUR`, indice unico e retorno nos DTOs/endpoints de turmas.
- O cadastro real, o seed de desenvolvimento e o modo demo passaram a gerar e corrigir `codigoRegistro` para turmas.
- A aba administrativa `Turmas` agora exibe e pesquisa pelo codigo de registro da turma.
- Criada a migration `AdicionarCodigoRegistroTurma`, preenchendo codigos para turmas ja existentes antes de criar o indice unico.
- Iniciada a organizacao estrutural do backend separando as configuracoes do Entity Framework em `Data/Configurations`.
- `PlataformaContext` ficou concentrado em `DbSet`s e aplicacao automatica das configuracoes por assembly.
- Iniciada a limpeza dos models removendo metodos operacionais com `Console.WriteLine` de `Aluno`, `Professor`, `Coordenador`, `Admin` e `Turma`.
- Criado `OperacoesAcademicasService` para concentrar essas operacoes demonstrativas, relatorios textuais e mutacoes auxiliares fora das entidades persistidas.
- Normalizados os feedbacks dos perfis com a nova entidade `FeedbackAcademico`, removendo as listas primitivas `Feedbacks` de `Aluno` e `Professor`.
- Removida a lista primitiva `TurmasAtribuidas` de `Professor`; a relacao oficial de professor com turma permanece em `Turma.ProfessorId`.
- Criada a migration `NormalizarFeedbackAcademico`, migrando os feedbacks antigos das colunas JSON antes de remover `Aluno_Feedbacks`, `Feedbacks` e `TurmasAtribuidas` da tabela `Usuarios`.

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
- Backend compilado com sucesso apos adicionar `CodigoRegistro` para professores:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Frontend compilado com sucesso apos incluir `MATRICULA` na tabela administrativa de `Professores`.
- Migration `AdicionarCodigoRegistroProfessor` aplicada no LocalDB com sucesso:
  `dotnet ef database update --configuration Release --no-build`
- Conferencia do EF confirmou ausencia de mudancas pendentes no modelo:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Backend compilado com sucesso apos adicionar `CodigoRegistro` para turmas:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Conferencia do EF confirmou ausencia de mudancas pendentes no modelo apos `CodigoRegistro` de turma:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Migration `AdicionarCodigoRegistroTurma` aplicada no LocalDB com sucesso:
  `dotnet ef database update --configuration Release --no-build`
- Frontend compilado com sucesso apos exibir cursos em popup na aba `Alunos`, status na aba `Professores` e registro na aba `Turmas`:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Backend compilado com sucesso apos separar as configuracoes do Entity Framework:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Conferencia do EF confirmou ausencia de mudancas pendentes no modelo apos a reorganizacao do `PlataformaContext`:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Backend compilado com sucesso apos mover operacoes demonstrativas dos models para service:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Conferencia do EF confirmou ausencia de mudancas pendentes no modelo apos limpar os metodos operacionais dos models:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Backend compilado com sucesso apos normalizar feedbacks e remover listas primitivas dos perfis:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Conferencia do EF confirmou ausencia de mudancas pendentes no modelo apos criar `FeedbackAcademico`:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Migration `NormalizarFeedbackAcademico` aplicada no LocalDB com sucesso:
  `dotnet ef database update --configuration Release --no-build`

## Proximos pontos sugeridos

- Revisar visualmente no navegador o fluxo completo do aluno: `MEUS CURSOS`, `REALIZAR AVALIACAO`, abertura da avaliacao e envio de respostas.
- Avaliar se as descricoes visuais em cards e secoes devem ser removidas ou escondidas em telas operacionais para reduzir poluicao da interface.
- Analisar se o modo demo esta equivalente ao projeto real em funcionalidades e interatividade, mapeando diferencas entre `demoApi.js` e os endpoints/regras do backend.
- No projeto real, criar feedbacks/confirmacoes para funcionalidades importantes como `Sair`, `Cancelar` e `Deslogar`, evitando acoes bruscas sem retorno claro para o usuario.
- Continuar o item pendente de tornar a tabela `MEUS CURSOS` clicavel/expansivel para exibir os modulos do curso.
- Continuar a organizacao estrutural planejando a normalizacao maior de `Usuarios` em tabelas de perfil (`Alunos`, `Professores`, `Coordenadores`, `Admins`) quando o fluxo atual estiver fechado.
