# Progresso - 2026-04-22

Sessao anterior Codex: `019db7bc-bbec-78b2-a190-ebc1019e4d74`

## Contexto recuperado

- Responsividade do workspace foi padronizada.
- Matriculas do coordenador passaram a usar acoes em lote no topo da tabela.
- Cards de resumo do coordenador ficaram restritos ao Panorama.
- Cursos do coordenador foram filtrados por responsabilidade e status ativo.
- Proximo passo identificado: evoluir a experiencia do aluno para consumir conteudos publicados e refletir progresso por modulo.

## Implementado na ultima retomada

- Criado fluxo backend de progresso do aluno em `ProgressosController`.
- Criado servico `ProgressoAlunoService` para marcar conteudo como concluido.
- Recalculo de progresso por modulo e por curso a partir dos conteudos publicados da turma.
- Snapshot de progresso do aluno exposto em `GET /api/Progressos/aluno/{alunoId}`.
- Acao de conclusao exposta em `PUT /api/Progressos/conteudos/{conteudoId}/concluir`.
- Frontend do aluno passou a carregar progressos no snapshot do workspace.
- Secao de conteudos do aluno ganhou resumo por modulo, barra de progresso por conteudo e botao "Marcar concluido".
- Modo demo foi atualizado para simular snapshot e conclusao de conteudos.
- A tela de Turmas agora tem a mesma lógica de atribuição em lote
- A tela de Turmas agora tem filtros no mesmo padrão:Busca com lupa visual, filtro por Curso, filtro por Professor, opção Sem professor, botão Limpar filtros e contagem X de Y turmas.
-Feito. A tela de Professores agora tem o mesmo padrão:Busca com lupa visual, filtrando enquanto digita, filtro por Especialidade, botão Limpar filtros e contagem X de Y professores
-A tela de Alunos agora usa a mesma lógica visual de filtro da tela de Cursos.Adicionei busca com lupa visual, filtrando enquanto digita, filtro por status (Todos, Ativos, Inativos), botão Limpar filtros e contagem do tipo X de Y alunos.

## Validacao

- Build do Vite executado com sucesso usando o Node empacotado.
- Build Release do ASP.NET executado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Aplicacao iniciada em `http://localhost:5000`.
- Login com aluno demo validou conteudos liberados e `PUT /api/Progressos/conteudos/{conteudoId}/concluir`, retornando progresso 100% no modulo e curso do conteudo testado.
