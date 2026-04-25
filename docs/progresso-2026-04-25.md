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

## Validacao

- Frontend compilado com sucesso usando o Node empacotado:
  `C:\Users\Krigor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vite\bin\vite.js build`
- Nova validacao do frontend apos trocar a coluna de `Modulos` para alunos ativos tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos mover o formulario de `Modulos` para popup tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos reposicionar o botao `Criar modulo` e remover a contagem ao lado dele tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos adicionar selecao por linha e bloco de detalhes na tela de `Modulos` tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos reposicionar o detalhe de `Modulos` como coluna lateral tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos trocar a coluna de `Professores` para cursos em andamento tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos transformar `Cursos em andamento` em nome do curso com popup de lista tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos centralizar melhor o botao `+` da coluna `Cursos em andamento` tambem executou com sucesso usando o mesmo comando.
- Nova validacao do frontend apos adicionar o popup `Cadastrar professor` tambem executou com sucesso usando o mesmo comando.
- Backend compilado com sucesso:
  `dotnet build "Sistema Academico Integrado.csproj" -c Release /p:UseAppHost=false`
- Nova validacao do backend apos ajustar o `POST /api/Professores` tambem executou com sucesso usando o mesmo comando.

## Proximo passo sugerido

- Avaliar e implementar `CodigoRegistro` para `Curso` e `Modulo`, mantendo o `Id` como chave interna do banco e exibindo um codigo publico/rastreavel para controle, auditoria e suporte.
- Definir o padrao do codigo antes da implementacao, preferencialmente em formato curto, unico e pouco previsivel, como `CUR-A8F3K2` e `MOD-CUR-0001-01`.
- Revisar no navegador o fluxo do professor em `Conteudos`: busca, filtros combinados, selecao em lote, edicao e exclusao apos filtrar.
