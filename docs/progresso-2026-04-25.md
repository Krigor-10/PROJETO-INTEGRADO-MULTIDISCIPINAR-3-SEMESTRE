# Progresso - 2026-04-25

Base de retomada: `docs/progresso-2026-04-23.md`

## Contexto recuperado

- O ultimo registro apontava `frontend/src/pages/workspace/SecaoConteudosProfessor.jsx` como a principal tabela operacional ainda fora do padrao de toolbar unificado.
- As telas de `Cursos`, `Alunos`, `Professores`, `Turmas` e `Modulos` ja usavam busca com lupa visual, filtros focados, botao `Limpar filtros` e contagem de resultados.
- O checkout estava limpo antes desta retomada.

## Implementado nesta retomada

- `frontend/src/pages/workspace/SecaoConteudosProfessor.jsx` agora tem busca textual sem acento para conteudos publicados e rascunhos.
- A tabela de conteudos do professor ganhou filtros por curso, turma e status de publicacao.
- O filtro de turma passa a respeitar o curso escolhido, evitando combinacoes incoerentes.
- A toolbar passou a exibir resumo no formato `X de Y conteudos`.
- O botao `Limpar filtros` fica desabilitado quando nao ha filtro ativo.
- A mensagem vazia da tabela agora diferencia ausencia real de conteudos e resultado vazio por filtro aplicado.
- A selecao em lote foi restringida ao conjunto visivel apos os filtros, incluindo o checkbox de selecionar todos.
- Na aba `Modulos`, a coluna `Criado em` foi removida da tabela.
- A tabela de `Modulos` agora mostra `Alunos ativos`, calculando alunos distintos com matricula aprovada no curso do modulo e cadastro ativo quando a informacao existir.
- O formulario fixo `Novo modulo` foi removido da tela de `Modulos`.
- A tabela de `Modulos` agora tem o botao `Criar modulo`, que abre um popup para criar ou editar o modulo sem ocupar espaco fixo na tela.
- O botao `Criar modulo` foi posicionado no canto superior direito da tabela de `Modulos`.
- A contagem de modulos foi removida do lado do botao `Criar modulo`, permanecendo separada na barra de acoes da tabela.
- Cada linha da tabela de `Modulos` passou a ser clicavel e recebeu uma seta de detalhe no fim da linha.
- Ao clicar em um modulo, a tela rola para um bloco de informacoes com `Modulo`, `Curso`, `Professor` e `Quantidade de alunos ativos`.
- O professor exibido no detalhe do modulo e inferido pelas turmas vinculadas ao curso do modulo.
- O bloco de informacoes do modulo foi reposicionado como coluna lateral a direita da tabela em telas maiores.
- Na aba `Professores`, a coluna `Especialidade` foi removida da tabela.
- A tabela de `Professores` agora mostra `Cursos em andamento` a partir dos cursos distintos vinculados ao professor pelas turmas.
- A coluna `Cursos em andamento` passou a mostrar o nome do curso em vez da quantidade.
- Quando o professor esta vinculado a mais de um curso, a coluna exibe um botao `+` que abre um popup listando todos os cursos em andamento daquele professor.
- O botao `+` da coluna `Cursos em andamento` recebeu ajuste de alinhamento para ficar centralizado na acao circular.
- O filtro da tela de `Professores` passou de especialidade para curso, alinhado com a nova coluna exibida.
- A tela de `Professores` ganhou o botao `Cadastrar professor`, abrindo um popup com os dados pessoais, endereco, especialidade e senha de acesso.
- O botao `Cadastrar professor` recebeu o mesmo destaque verde do fluxo de criacao, com tonalidade um pouco mais suave.
- O botao de cadastro dentro do popup de professor tambem recebeu a tonalidade verde suavizada.
- Botoes de saida e cancelamento como `Sair`, `Fechar` e `Cancelar` passaram a usar vermelho suave.
- `Controllers/ProfessoresController.cs` passou a usar `CriarProfessorDto` no `POST /api/Professores`, validando e-mail/CPF duplicados e gerando `SenhaHash` com o perfil `Professor`.
- `frontend/src/lib/demoApi.js` passou a espelhar `POST /Professores` no modo demo e remove a senha das respostas de listagem.
- `Curso` e `Modulo` agora possuem `CodigoRegistro` persistido, com indices unicos e geracao automatica no backend.
- A migracao `AdicionarCodigoRegistroAcademico` preenche codigos para cursos e modulos existentes antes de tornar o campo obrigatorio.
- A tela de `Cursos` passou a exibir e pesquisar pelo codigo de registro.
- A tela de `Modulos` passou a exibir e pesquisar pelo codigo de registro, incluindo o detalhe lateral do modulo.
- O modo demo passou a preencher codigos nos dados iniciais e a corrigir bases antigas salvas no navegador sem esse campo.
- `Matricula` agora possui `CodigoRegistro` persistido, com indice unico e geracao automatica no cadastro completo, no servico de matricula e no seed de desenvolvimento.
- A tabela administrativa `Fluxo de matriculas` deixou de exibir o `Id` interno do banco e passou a mostrar o codigo publico da matricula.
- O modo demo passou a gerar e corrigir `codigoRegistro` tambem para matriculas.
- Ao aprovar uma matricula, o backend garante o `CodigoRegistro` e atribui esse codigo como a matricula oficial do aluno.
- Novos cadastros completos de aluno ficam com `Matricula` como `Pendente` ate a aprovacao administrativa.
- O modo demo passou a espelhar essa regra, atribuindo o codigo da matricula ao aluno aprovado.
- A entidade `Avaliacao` passou a ser exposta para o acesso professor por meio de `GET/POST/PUT/DELETE /api/Avaliacoes`.
- O backend valida se a turma pertence ao professor autenticado e se o modulo pertence ao mesmo curso da turma antes de salvar a avaliacao.
- A tela do professor ganhou a nova aba `Avaliacoes`, com busca, filtros por curso/turma/tipo/status, selecao em lote, edicao, exclusao e popup de criacao.
- O formulario de avaliacao permite definir titulo, descricao, turma, modulo, tipo, status, periodo de abertura/fechamento, tentativas, tempo limite, nota maxima e pesos.
- O snapshot do professor agora carrega avaliacoes junto com cursos, modulos, turmas e conteudos.
- O modo demo passou a mapear os endpoints de avaliacoes, incluir dados iniciais e preservar avaliacoes antigas no navegador.
- A aba `Avaliacoes` agora tem o botao `Montar questoes`, habilitado quando uma avaliacao esta selecionada.
- O modal `Montar questoes` permite cadastrar questoes de multipla escolha, verdadeiro/falso e discursivas, com enunciado, contexto, pontos, dificuldade, tema, explicacao e alternativas.
- Para questoes objetivas, o professor preenche as alternativas e marca exatamente uma correta; para verdadeiro/falso, as opcoes `Verdadeiro` e `Falso` sao montadas automaticamente.
- O backend passou a expor `GET/POST /api/Avaliacoes/{id}/questoes` e `DELETE /api/Avaliacoes/{id}/questoes/{questaoId}` para montar e revisar questoes da avaliacao.
- Ao adicionar uma questao, o sistema cria a questao no banco e publica um snapshot na avaliacao, preservando alternativas e pontuacao.
- O modo demo passou a espelhar a montagem de questoes e alternativas em `frontend/src/lib/demoApi.js`.


## Validacao


  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Nova validacao do backend apos ajustar o `POST /api/Professores` tambem executou com sucesso usando o mesmo comando.
- Backend compilado com sucesso apos implementar `CodigoRegistro`:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Frontend compilado com sucesso apos exibir `CodigoRegistro`:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Migracao aplicada no LocalDB com sucesso:
  `dotnet ef database update --no-build`
- Conferencia no LocalDB confirmou `0` cursos e `0` modulos sem codigo de registro.
- Backend compilado com sucesso apos implementar `CodigoRegistro` em matriculas:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Frontend compilado com sucesso apos trocar a coluna `ID` por `Codigo` no fluxo de matriculas:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Migracao de matriculas aplicada no LocalDB com sucesso:
  `dotnet ef database update --configuration Release --no-build`
- Conferencia no LocalDB confirmou `0` matriculas sem codigo de registro.
- Backend compilado com sucesso apos mover a atribuicao oficial da matricula para a aprovacao:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Frontend compilado com sucesso apos ajustar o modo demo para atribuir a matricula oficial na aprovacao:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Backend compilado com sucesso apos criar o fluxo de avaliacoes do professor:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Frontend compilado com sucesso apos adicionar a aba `Avaliacoes` no acesso professor:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Conferencia do EF confirmou ausencia de mudancas pendentes no modelo apos o fluxo de avaliacoes:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Smoke test autenticado em `http://localhost:5010` validou login de professor, listagem, criacao temporaria e exclusao de avaliacao em `POST/DELETE /api/Avaliacoes`.
- Backend compilado com sucesso apos adicionar a montagem de questoes:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Frontend compilado com sucesso apos adicionar o botao e modal `Montar questoes`:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Conferencia do EF seguiu sem mudancas pendentes no modelo apos a montagem de questoes:
  `dotnet ef migrations has-pending-model-changes --configuration Release --no-build`
- Smoke test autenticado em `http://localhost:5010` validou criar avaliacao temporaria, adicionar questao com 4 alternativas, listar questoes e remover os registros temporarios.

## VERIFICAR NA PRÓXIMA RETOMADA 27/04/2026

- banco salvou errado as questão correta, verificar como esta sendo validado a alternativa correta.
- no acesso do aluno, criar um botão "REALIZAR AVALIAÇÃO" que vai ser publicado as avaliações do professor.
- botão de CONCLUIR MONTAGEM na tela do professor esta vermelho, colcoar uma cor azul talvez para melhorar a UX.
- Na tela do professor deixar apenas o botão "ADICIONAR NOVA AVALIAÇÃO" que esta no topo da tela e remover o botão "CRAIR AVALIAÇÃO" de dentro da tabela
-na tela de MEUS CURSOS do aluno, mostra os cursos que ele esta cadastrado! quero que essa tabela seja clicavel, para 
que quando ele clicar no curso, essa linha expanda e mostre os modulos daquele curso.