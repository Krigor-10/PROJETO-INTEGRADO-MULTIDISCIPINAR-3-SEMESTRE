# Progresso - 2026-04-28

Base de retomada: `docs/progresso-2026-04-28.md`

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
- Iniciada a normalizacao maior de usuarios com mapeamento TPT: `Usuarios` ficou como tabela base e os perfis passaram para `Admins`, `Alunos`, `Coordenadores` e `Professores`.
- Criada a migration `NormalizarPerfisUsuario`, copiando os dados especificos dos perfis antes de remover `Matricula`, `TurmaAtual`, `CursoResponsavel`, `CodigoRegistro` e `Especialidade` da tabela `Usuarios`.
- A migration de perfis foi ajustada para remover FKs antigas de forma resiliente quando a constraint existir fisicamente no banco.

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
- Backend compilado com sucesso apos mapear os perfis de usuario em TPT:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Conferencia do EF confirmou ausencia de mudancas pendentes no modelo apos normalizar perfis:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Migration `NormalizarPerfisUsuario` aplicada no LocalDB com sucesso:
  `dotnet ef database update --configuration Release --no-build`
- Conferencia de dados no LocalDB confirmou paridade entre `Usuarios.TipoUsuario` e tabelas de perfil:
  `Admins=1`, `Alunos=22`, `Coordenadores=6`, `Professores=7`.
- Smoke test real da API em `http://127.0.0.1:5012` validou login e endpoints principais apos TPT:
  `admin@edtech.local`, `professor@edtech.local` e `aluno@edtech.local` autenticaram com sucesso.
- O smoke test confirmou respostas para `Cursos`, `Turmas`, `Alunos`, `Professores`, `Coordenadores`, `Turmas/minhas`, `Cursos/meus` e `Alunos/teste-jwt`.

- Frontend e backend recompilados com sucesso na retomada de validacao:
  `node.exe .\node_modules\vite\bin\vite.js build`
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Conferencia do EF confirmou ausencia de mudancas pendentes apos a validacao:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Aplicacao real subida em `http://127.0.0.1:5012` pelo DLL Release, pois `dotnet run --no-build` procura um `.exe` quando o build usa `UseAppHost=false`.
- API real validada com o aluno `aluno@edtech.local`; antes de criar fixture de teste, `GET /api/Avaliacoes/aluno/2` retornava `0` avaliacoes publicadas.
- Criada uma avaliacao real de validacao com o professor `professor.teste01@edtech.local`, porque ele e o professor das turmas aprovadas do aluno demo.
- Fluxo visual real do aluno validado no Edge headless:
  login, `REALIZAR AVALIACAO`, listagem da avaliacao, abertura do modal, resposta objetiva e envio com sucesso.
- Resultado visual/API da tentativa: `Avaliacao enviada com sucesso. Nota: 10,0 de 10,0.`, com `tentativasRealizadas=1`, `tentativasRestantes=2` e `ultimaNota=10.00`.
- Evidencias visuais salvas em:
  `logs/validacao-aluno-panorama.png`
  `logs/validacao-aluno-avaliacoes-lista.png`
  `logs/validacao-aluno-avaliacao-aberta.png`
  `logs/validacao-aluno-avaliacao-enviada.png`

## Registro - 2026-04-29 - Home publica e carrossel

- Home publica reorganizada para a marca `CodeRyse Academy`, com metadados, titulo do navegador e favicon atualizados.
- Banner publico simplificado: removido o card lateral do hero e removidos os indicadores `11 cursos` e `4 perfis`.
- Textos da home publica ajustados para uma narrativa mais direta de cursos digitais, matricula e acesso ao painel.
- Secao de diferenciais movida para uma faixa propria abaixo do banner, mantendo os pilares da plataforma sem poluir o hero.
- Carrossel publico passou a renderizar imagem por curso a partir de assets locais em `frontend/src/assets`.
- Imagem do curso `Desenvolvimento Web Full Stack` aumentada junto com a area visual dos cards do carrossel.
- Removido o rotulo sobre a imagem do card (`Trilha em destaque` / badge visual), deixando a capa limpa.
- Mapeadas imagens especificas para:
  - `Desenvolvimento Web Full Stack`
  - `Ciencia de Dados Aplicada`
  - `UX para Produtos Digitais`
  - `Arquitetura de Software Moderna`
  - `Python para Automacao e Dados`
  - `DevOps e Cloud Foundations`
  - `Engenharia de Prompt e IA Generativa`
  - `Cyberseguranca para Aplicacoes Web`
  - `Mobile com React Native`
  - `QA e Automacao de Testes`
- Curso `Product Analytics para EdTech` removido do seed de desenvolvimento em `DevelopmentDataSeeder`.
- Home publica passou a filtrar `Product Analytics para EdTech`, garantindo que o card nao apareca mesmo quando o registro ainda existe no LocalDB antigo.
- Observacao importante: a API real ainda possuia o curso `Product Analytics para EdTech` no LocalDB como `id=8`; exclusao fisica do banco nao foi feita porque apagaria dado local e precisa confirmacao explicita.
- Bundle React recompilado e publicado em `wwwroot/assets/react` com os assets finais do carrossel.
- Validacao final realizada:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
  `node.exe .\node_modules\vite\bin\vite.js build`
- Smoke test visual da home publica em `http://127.0.0.1:5012` confirmou:
  `productCount=0`, `cardCount=10`, `fallbackCount=0`.
- Evidencias visuais salvas em:
  `logs/home-publica-sem-product-analytics.png`
  `logs/home-publica-todas-imagens-cursos.png`
- Alteracoes commitadas e enviadas para `origin/main`:
  `f7442b0 - Atualiza home publica e carrossel de cursos`

## Registro - 2026-04-30 - Preparacao para demonstracao

- Iniciada a refatoracao de apresentacao com foco em demonstracao, sem mexer em schema, migrations ou regras estruturais de backend.
- A tela do aluno em `MEUS CURSOS` passou a ter linhas clicaveis e coluna lateral de detalhe, mostrando curso, turma, modulos, materiais publicados, progresso e status por modulo.
- O detalhe de `MEUS CURSOS` evoluiu para uma jornada guiada do curso, com `Proxima acao`, modulos expansivos, conteudos por modulo e avaliacoes vinculadas ao modulo.
- `MEUS CURSOS` passou a receber `snapshot.avaliacoes` para encaixar avaliacoes no contexto correto do curso/modulo, mantendo `Conteudos` e `Realizar avaliacao` como atalhos de apoio.
- A tela do aluno em `MEUS CURSOS` deixou de exibir os cards informativos superiores, mantendo o foco na tabela e no detalhe lateral.
- A tela do aluno em `Conteudos` deixou de exibir os cards `Acesso por turma` e `Progresso por modulo`, mantendo a biblioteca de materiais como foco principal.
- O card `Experiencia do aluno` da tela de `Conteudos` foi movido para o final, abaixo da biblioteca de materiais.
- A tela do aluno em `Realizar avaliacao` deixou de exibir o card informativo superior, mantendo o foco na tabela de avaliacoes publicadas.
- Corrigido o resumo global do workspace para tambem ocultar os cards informativos na rota `avaliacoes` do aluno.
- A acao de abrir materiais continua disponivel a partir do detalhe do curso selecionado.
- O workspace passou a pedir confirmacao visual antes de `Sair` e `Sair do demo`, com botao `Cancelar` para evitar encerramento brusco de sessao.
- O frontend passou a centralizar o parsing de datas da API em `parseApiDate`/`timestampFromApiDate`, tratando datetimes serializados sem timezone como UTC para evitar avaliacao aparecendo indevidamente como futura.
- `SecaoAvaliacoesProfessor`, `SecaoAvaliacoesAluno`, `SecaoConteudosAluno` e os cards de resumo do workspace passaram a usar o parsing consistente de datas nos pontos visiveis afetados.
- Bundle React recompilado e publicado em `wwwroot/assets/react` com os assets finais desta retomada.
- Seed de desenvolvimento atualizado para garantir o aluno `Krigor Sousa` (`krigordesousa@gmail.com`) e adicionar 3 matriculas pendentes de curso para testar o novo fluxo de `MEUS CURSOS`.

- As pendencias do Krigor foram criadas de forma idempotente para `UX para Produtos Digitais`, `Arquitetura de Software Moderna` e `Python para Automacao e Dados`, preservando matriculas ja existentes do aluno.
- Corrigida a ambiguidade no ADMIN entre codigo do aluno (`ALU-*`) e codigo de solicitacao de curso (`MAT-*`): a tabela de `Alunos` deixou de usar codigo de matricula de curso como fallback para a matricula do aluno.

- O cadastro completo de aluno agora gera uma matricula propria do aluno com prefixo `ALU`, e a aprovacao de matricula nao substitui mais esse codigo pelo codigo da solicitacao do curso.

- No modo demo, a mesma regra foi espelhada: alunos recebem codigo `ALU-*`, enquanto matriculas/solicitacoes continuam com codigo `MAT-*`.

- Na tela de `Matriculas` do ADMIN, a coluna de `Codigo` foi renomeada para `Solicitacao`, reduzindo a confusao quando o mesmo aluno possui varios cursos pendentes.
- Labels das tabelas administrativas atualizados para nomenclatura semantica, sem alterar banco ou contratos da API:
  `REGISTRO DO ALUNO`, `PROTOCOLO DA SOLICITACAO`, `REGISTRO DO PROFESSOR`, `CODIGO DO CURSO`, `CODIGO DA TURMA` e `CODIGO DO MODULO`.

- O detalhe lateral de modulos tambem passou a exibir `Codigo do modulo`, mantendo consistencia com a tabela.

## Validacao - 2026-04-30

- A primeira tentativa de build com `node` do PATH falhou com `Acesso negado`, comportamento ja conhecido neste ambiente.
- Frontend compilado com sucesso usando o Node bundled do Codex:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- `git diff --check` executado sem erros de whitespace, apenas avisos normais de conversao LF/CRLF no Windows.
- Frontend recompilado com sucesso apos remover os cards informativos de `MEUS CURSOS`:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Frontend recompilado com sucesso apos remover `Acesso por turma` e `Progresso por modulo` da tela de `Conteudos`:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Frontend recompilado com sucesso apos mover `Experiencia do aluno` para baixo da biblioteca:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Frontend recompilado com sucesso apos remover o card informativo de `Realizar avaliacao`:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Frontend recompilado com sucesso apos ocultar os cards globais na rota `avaliacoes` do aluno:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Frontend recompilado com sucesso apos implementar a jornada guiada de curso em `MEUS CURSOS`:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Busca no codigo confirmou ausencia dos cards antigos `Acesso por turma`, `Progresso por modulo` e `resumoAvaliacoes` na tela do aluno.
- Vite local respondeu `STATUS=200` em `http://127.0.0.1:5173/app/meus-cursos`.
- Backend compilado com sucesso apos adicionar as pendencias de curso do Krigor:

  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`

- Startup em Development executado via DLL Release em `http://127.0.0.1:5014`, disparando migrations e seed no LocalDB.

- LocalDB confirmou `Krigor Sousa` com 3 matriculas pendentes (`UX para Produtos Digitais`, `Arquitetura de Software Moderna`, `Python para Automacao e Dados`) e a matricula aprovada existente em `Mobile com React Native` preservada.
- Backend recompilado com sucesso apos separar codigo do aluno e codigo da solicitacao:

  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`

- Frontend recompilado com sucesso apos ajustar ADMIN `Alunos`, `Matriculas` e modo demo:

  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`

- Startup em Development executado via DLL Release em `http://127.0.0.1:5015`, reaplicando o seed no LocalDB.

- LocalDB confirmou `Krigor Sousa` com 1 codigo de aluno (`ALU-KRIGOR`) e 3 solicitacoes pendentes de curso (`MAT-*`) preservadas para teste do fluxo.
- Frontend recompilado com sucesso apos renomear os labels administrativos para nomenclatura semantica:

  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`

## Proximos pontos sugeridos

- Continuar a preparacao visual para demonstracao revisando as principais telas com a aplicacao aberta no navegador.
- Avaliar se as descricoes visuais em cards e secoes devem ser removidas ou escondidas em telas operacionais para reduzir poluicao da interface.
- Analisar se o modo demo esta equivalente ao projeto real em funcionalidades e interatividade, mapeando diferencas entre `demoApi.js` e os endpoints/regras do backend.
- Expandir confirmacoes/feedbacks para outros pontos de `Cancelar` e `Deslogar` que ainda fechem popups ou descartem formularios sem aviso.
- Fazer uma validacao visual especifica da nova coluna lateral de `MEUS CURSOS` no aluno real e no modo demo.
- Proximo passo estrutural: normalizar endereco de `Usuario` em tabela propria, depois de uma validacao visual rapida do login e das telas principais com o mapeamento TPT.
- Acompanhar o tratamento de `dataAbertura`/`dataFechamento` das avaliacoes em smoke test real para confirmar que o parsing UTC resolveu o desvio visual.
- Aplicar media queries, font stack, adaptar tela para impressão, Switch modo escuro
- Aluno ao se cadastrar, enviar um e-mail com senha de acesso, ou SMS via celular, o que for mais facil de implementar

## Implementação para esta retomada 01/05/2026

- eu quero que ao selecionar os alunos pendentes, poder fazer aprovação em massa e assim respectivamente atribuir autmaticamente cada aluno a turma escolhida no cadastro, sem precisar
ficar escolhendo cada curso para cada aluno, quero aprovação em massa e o sistema atribui nas turmas automatico.
- media queries, font stack, adaptar tela para impressão, Switch modo escuro.
- Aluno ao se cadastrar, enviar um e-mail com senha de acesso, ou SMS via celular, o que for mais facil de implementar.
-  Proximo passo estrutural: normalizar endereco de `Usuario` em tabela propria.

## Implementado - 2026-05-01 - Aprovacao em lote automatica

- A tela administrativa de `Matriculas` deixou de exigir escolha manual de turma para aprovar pendencias em lote.
- O admin/coordenador agora seleciona varios alunos pendentes, inclusive de cursos diferentes, e usa `Aprovar selecionadas`.
- Criado o endpoint real `PUT /api/Matriculas/aprovar-lote`, recebendo a lista de matriculas e retornando aprovadas e erros por item.
- A regra de aprovacao automatica usa a turma ja vinculada a matricula quando existir; quando a solicitacao veio apenas com curso, seleciona a primeira turma cadastrada daquele curso por data de criacao/id.
- Quando nao existe turma cadastrada para o curso, o lote continua processando as demais matriculas e devolve erro claro para o item afetado.
- O modo demo passou a espelhar a mesma regra em `frontend/src/lib/demoApi.js`.
- O seed de desenvolvimento passou a garantir turmas para os cursos com pendencias usadas na demonstracao: `UX-2026-A`, `ARQ-2026-A`, `PY-2026-A`, `DEVOPS-2026-A` e `PROMPT-2026-A`.

## Validacao - 2026-05-01

- Backend compilado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- EF confirmou ausencia de mudancas pendentes no modelo:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- A primeira tentativa de Vite normal falhou com `EPERM` ao limpar `wwwroot/assets`, por permissao/trava do diretorio de saida.
- Frontend compilado e publicado com sucesso sem limpar o diretorio de saida:
  `node.exe .\node_modules\vite\bin\vite.js build --emptyOutDir false`
- Smoke test real em `http://127.0.0.1:5016` validou login admin e `PUT /api/Matriculas/aprovar-lote`.
- Resultado do smoke: `matriculaTestada=4`, `totalSolicitado=1`, `totalAprovado=1`, `totalComErro=0`, turma atribuida `UX-2026-A`.

## Implementado - 2026-05-01 - Turma padrao unica por curso

- Padronizada a regra operacional de plataforma online: cada curso seedado passa a ter uma unica `Turma online - {Curso}`.
- `POST /api/Turmas` agora cria somente a turma padrao do curso, aceita o nome como opcional e bloqueia a segunda turma do mesmo curso com conflito `409`.
- O seed de desenvolvimento consolida turmas duplicadas dos cursos seedados, movendo matriculas, conteudos e avaliacoes para a turma padrao antes de remover a turma excedente.
- A tela `Turmas` passou a orientar criacao apenas para cursos sem turma padrao, com nome automatico e feedback quando todos os cursos ja estao padronizados.
- `Cursos`, `Matriculas`, conteudos do professor e modo demo foram ajustados para comunicar `turma padrao` em vez de sugerir multiplas turmas por curso.

## Validacao - 2026-05-01 - Turma padrao unica

- Backend recompilado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- EF confirmou ausencia de mudancas pendentes no modelo:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Frontend recompilado com sucesso usando Vite sem limpar o diretorio de saida:
  `node.exe .\node_modules\vite\bin\vite.js build --emptyOutDir false`
- Smoke test real em `http://127.0.0.1:5016` confirmou `10` cursos seedados, `0` cursos sem turma padrao e `0` cursos com quantidade invalida de turmas.
- O mesmo smoke tentou criar uma segunda turma para `Desenvolvimento Web Full Stack` e recebeu `409` com a mensagem `Este curso ja possui uma turma padrao...`.
- Durante o smoke, o seed consolidou o dado legado de `Python para Automacao e Dados`, que ainda tinha `PY-2026-A` alem da turma padrao.
## Implementado - 2026-05-01 - Professor responsavel por turma padrao

- O seed de desenvolvimento agora distribui professores por afinidade de curso ao criar ou atualizar as turmas padrao.
- Turmas existentes tambem passam a receber a atribuicao deterministica no seed, em vez de preservar concentracao acidental no `Professor Demo`.
- A distribuicao validada ficou com `Professor Demo` em Full Stack, `Professor Teste 01` em UX/Mobile, `Professor Teste 02` em Arquitetura/Cyberseguranca, `Professor Teste 03` em Dados/Python/Prompt, `Professor Teste 04` em DevOps e `Professor Teste 05` em QA.

## Validacao - 2026-05-01 - Professor por turma

- Backend recompilado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- EF confirmou ausencia de mudancas pendentes no modelo:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Startup real em `http://127.0.0.1:5016` reaplicou o seed no LocalDB.
- Smoke via API confirmou `10` turmas, `0` turmas sem professor e `6` professores distintos vinculados as turmas padrao.
## Implementado - 2026-05-01 - Mais 4 professores de teste

- O seed de desenvolvimento passou de `5` para `9` professores adicionais, criando `Professor Teste 06` a `Professor Teste 09` de forma idempotente.
- As especialidades dos professores de teste foram alinhadas aos cursos seedados para permitir uma turma padrao com professor dedicado.
- A distribuicao das turmas padrao agora usa os `10` professores disponiveis na ordem dos cursos seedados, evitando repeticao de professor entre as `10` turmas.
- O modo demo tambem recebeu mais `4` professores no banco inicial para manter a tela de professores mais proxima do ambiente real.

## Validacao - 2026-05-01 - Mais professores

- Backend recompilado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- EF confirmou ausencia de mudancas pendentes no modelo:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Frontend recompilado com sucesso usando Vite sem limpar o diretorio de saida:
  `node.exe .\node_modules\vite\bin\vite.js build --emptyOutDir false`
- Startup real em `http://127.0.0.1:5016` reaplicou o seed no LocalDB.
- Smoke via API confirmou `11` professores totais, `9` professores de teste, os novos `professor.teste06` a `professor.teste09` com `PROF-*`, `10` turmas e `10` professores distintos vinculados as turmas padrao.

## Implementado - 2026-05-04 - Conteudos do aluno por curso e modulo

- A tela de `Conteudos` do aluno passou a organizar a trilha em `Curso` recolhivel > `Modulo` recolhivel > materiais compactos.
- O detalhe lateral foi removido; ao selecionar um material, o detalhe abre abaixo do proprio item da lista.
- A hierarquia visual foi refinada com mais separacao entre curso, modulo e conteudo, mantendo a cor apenas como apoio visual discreto.
- A tela agora recebe `modulos`, `cursos` e `turmas` no snapshot do aluno para listar tambem cursos aprovados que ainda nao possuem conteudo publicado.
- Criado o endpoint real `GET /api/Modulos/aluno/{alunoId}`, retornando modulos dos cursos em que o aluno possui matricula aprovada.
- `frontend/src/lib/dashboard.js`, `WorkspaceScreen.jsx` e `frontend/src/lib/demoApi.js` foram alinhados para manter o mesmo comportamento no backend real e no modo demo.
- Os registros antigos de proximas tarefas sobre hierarquia de conteudos, detalhe lateral e cursos sem conteudo foram removidos desta nota porque foram concluidos neste ciclo.

## Corrigido - 2026-05-04 - Aprovacao de matricula duplicada

- Corrigido o caso em que uma pendencia duplicada aparecia para aluno que ja tinha matricula aprovada na mesma turma.
- `Services/MatriculaService.cs` agora consolida a pendencia duplicada, cancela a solicitacao redundante e preserva a matricula ativa.
- `Data/DevelopmentDataSeeder.cs` deixou de recriar pendencias para aluno que ja possui matricula aprovada no mesmo curso; se encontrar duplicata antiga, marca a pendencia como cancelada.
- O modo demo recebeu a mesma regra em `frontend/src/lib/demoApi.js`.
- Caso validado: `Aluno Teste 01` tinha uma matricula aprovada e uma pendencia duplicada em `UX para Produtos Digitais`; apos o ajuste, ficou sem pendencias duplicadas.

## Validacao - 2026-05-04

- Backend recompilado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- EF confirmou ausencia de mudancas pendentes no modelo:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Frontend recompilado com sucesso usando Vite sem limpar o diretorio de saida:
  `node.exe .\node_modules\vite\bin\vite.js build --emptyOutDir false`
- `git diff --check` executado nos arquivos alterados sem erros de whitespace, apenas avisos normais de conversao LF/CRLF no Windows.
- Aplicacao real ficou disponivel em `http://127.0.0.1:5019` usando o DLL Release.
- Smoke HTTP confirmou que `wwwroot/index.html` referencia os bundles atuais `index-Df1JUE0A.js` e `index-CHMu3c2a.css`.
- Consulta no LocalDB confirmou `pendentes_aluno_teste_01=0` e `PendenciasDuplicadas=0`.
## Proximo ajuste - Refatoracao CSS semantica

- Reorganizar os arquivos `.css` do frontend com nomes semanticos em portugues para facilitar identificacao e manutencao.
- Separar sem alterar visual primeiro, validando build antes de qualquer renomeacao mais profunda de classes.
- Aproveitar a refatoracao para identificar e remover codigo morto, estilos nao usados e componentes/variaveis obsoletos com validacao depois de cada limpeza.
- Sugestao inicial: `base.css`, `publico.css`, `workspace.css`, `aluno.css`, `gestao.css`, `professor.css` e `componentes.css`.
## Melhoria futura - Navegacao global e menu lateral

- Adicionar uma navegacao global para os perfis `Admin`, `Coordenador` e `Professor`, facilitando troca entre areas principais sem depender apenas do menu lateral.
- Reorganizar o menu lateral do workspace por grupos semanticos, separando gestao academica, operacao, conteudos/avaliacoes e perfil/sessao.
- Preservar a experiencia do aluno ja focada em `Meus cursos`, `Conteudos`, `Avaliacoes` e `Matriculas`, ajustando apenas se houver ganho claro de navegacao.
- Validar responsividade desktop/mobile para evitar menus longos, duplicados ou com acoes importantes escondidas.
- Reduzir o menu/modal de perfil do usuario para informacoes essenciais, mantendo identificacao, perfil, contato principal e acoes de sessao sem excesso de detalhes.
## Implementado - 2026-05-04 - Aba Coordenadores no Admin

- Adicionada a aba `Coordenadores` no menu do Admin.
- Criada a tela `SecaoCoordenadores`, listando `REGISTRO DO COORDENADOR`, `NOME`, `EMAIL`, `CURSO SOB SUPERVISAO` e `STATUS`.
- A tabela segue o padrao das telas administrativas com busca ao vivo, filtro por status, contador de resultados e popup quando um coordenador supervisiona mais de um curso.
- `Coordenador` ganhou `CodigoRegistro` publico no backend, usando o prefixo `COORD-*`, evitando expor o id interno do banco.
- Criada a migration `20260504215933_AdicionarCodigoRegistroCoordenador`, com preenchimento seguro para coordenadores existentes antes do indice unico.
- `GET /api/Coordenadores`, `POST /api/Coordenadores`, DTOs, seed de desenvolvimento e modo demo foram alinhados ao novo registro publico.
- O modo demo passou a garantir `codigoRegistro` para coordenadores antigos e novos carregamentos da base local.

## Validacao - 2026-05-04 - Aba Coordenadores

- Backend recompilado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- EF confirmou ausencia de mudancas pendentes no modelo:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Migration aplicada no LocalDB com sucesso:
  `dotnet ef database update --configuration Release --no-build`
- A primeira tentativa de Vite com `node.exe` do PATH falhou com `Acesso negado`, conforme problema conhecido do ambiente Windows.
- Frontend recompilado com sucesso usando o Node empacotado do Codex:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build --emptyOutDir false`
- Smoke real em `http://127.0.0.1:5021` validou login Admin e `GET /api/Coordenadores`.
- Resultado do smoke: `6` coordenadores, `0` sem codigo `COORD-*`, `6` com curso sob supervisao e primeiro registro `COORD-000003`.
## Complemento - 2026-05-04 - Cadastro de coordenacao

- Adicionado na aba `Coordenadores` o botao `Cadastrar coordenacao`, seguindo o mesmo padrao visual do botao `Cadastrar professor`.
- O botao abre um modal de cadastro com dados de identificacao, endereco, curso sob supervisao, senha e confirmacao de senha.
- A tela valida campos obrigatorios, CPF, CEP, UF e confirmacao de senha antes de chamar a API.
- Ao salvar com sucesso, a lista de coordenadores e atualizada e exibe feedback no topo da tabela.
- O modo demo recebeu `POST /Coordenadores`, criando coordenadores com `COORD-*` para manter paridade com o backend real.

## Validacao - 2026-05-04 - Cadastro de coordenacao

- Backend recompilado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Frontend recompilado com sucesso usando o Node empacotado do Codex:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build --emptyOutDir false`
- Smoke real em `http://127.0.0.1:5021` validou login Admin, `POST /api/Coordenadores` e nova listagem via `GET /api/Coordenadores`.
- Resultado do smoke: coordenacao criada com registro `COORD-E9XBM6`, encontrada na listagem, total subiu para `7` coordenadores no LocalDB de desenvolvimento.
## Complemento - 2026-05-04 - Modulos recolhiveis por curso

- A tela administrativa de `Modulos` deixou de repetir o curso em cada linha como visual principal.
- A tabela agora agrupa por `Curso`; ao clicar na linha do curso, os modulos daquele curso expandem ou recolhem logo abaixo.
- As acoes existentes foram preservadas: busca ao vivo, filtro por curso, selecionar todos, selecionar modulos de um curso, editar selecionado, excluir selecionados e detalhe lateral do modulo.
- Quando a navegacao vem de `Cursos > Ver modulos`, o curso em foco ja abre expandido.

## Validacao - 2026-05-04 - Modulos recolhiveis por curso

- Frontend recompilado com sucesso usando o Node empacotado do Codex:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build --emptyOutDir false`

- ajustar modulos modo recolhivel, destacar que o módulo é do curso acima.
- feedback para ações imporantes de exclusão, edição. "deseja realmente excluir?" "deseja realmente editar?" "trocar"
- organizar o modulo CURSOS de admin, limpar a planilha.
- add filtro por curso e turma, admin.
- 
- 