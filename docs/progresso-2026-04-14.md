# Progresso do Projeto

Data: 2026-04-14

## O que foi concluido hoje

- Foi criado o nucleo pedagogico inicial no backend para suportar conteudos, avaliacoes, banco de questoes, respostas, notas e progresso.
- Foram adicionados os endpoints de gestao de modulos para `Admin` e `Coordenador`.
- A tela React de gestao de modulos foi integrada ao workspace autenticado.
- A home publica teve a navegacao global ajustada para permanecer visivel durante a rolagem.
- Foi implementada a area do professor para publicar e manter `ConteudoDidatico` por turma e modulo.

## Backend

- Criadas as entidades pedagogicas base:
  - `ConteudoDidatico`
  - `QuestaoBanco`
  - `AlternativaQuestaoBanco`
  - `AnexoQuestaoBanco`
  - `Avaliacao`
  - `QuestaoPublicada`
  - `AlternativaQuestaoPublicada`
  - `TentativaAvaliacao`
  - `RespostaAluno`
  - `LancamentoNotaAluno`
  - `ProgressoConteudoAluno`
  - `ProgressoModuloAluno`
  - `ProgressoCursoAluno`
  - `MarcoProgressoAluno`
- Foram adicionados enums e configuracoes EF Core para esse novo dominio.
- O `PlataformaContext` passou a expor os novos `DbSet`s e relacionamentos.
- Foram geradas as migrations do nucleo pedagogico e da gestao de modulos.

## Gestao de Modulos

- Criados DTOs para criacao, atualizacao e retorno de modulo.
- Criados `IModuloRepository`, `IModuloService`, `ModuloRepository` e `ModuloService`.
- Criado `ModulosController` com as rotas:
  - `GET /api/Modulos`
  - `GET /api/Modulos/{id}`
  - `GET /api/Modulos/curso/{cursoId}`
  - `POST /api/Modulos`
  - `PUT /api/Modulos/{id}`
  - `DELETE /api/Modulos/{id}`
- Foi adicionado indice unico por `CursoId + Titulo` para evitar modulos duplicados no mesmo curso.

## Frontend React

- O menu lateral do workspace agora possui a secao `Modulos` para perfis gestores.
- O snapshot do painel passou a carregar `GET /api/Modulos`.
- A nova tela de modulos permite:
  - criar modulo
  - editar titulo
  - excluir modulo
  - listar modulos por curso
- O formulario recebeu ajustes de UX:
  - dropdown em tema escuro
  - cursos ordenados alfabeticamente
  - feedback visual de sucesso e erro
- O menu lateral do professor agora possui a secao `Conteudos`.
- A nova tela de conteudos permite:
  - criar material por turma e modulo
  - editar titulo, descricao, status, ordem e peso de progresso
  - publicar texto, PDF, video ou link externo
  - excluir conteudos ja cadastrados
- O panorama do professor passou a destacar contagem de conteudos, rascunhos e publicados.

## Conteudos Didaticos

- Foram criados DTOs, repository, service e controller para `ConteudoDidatico`.
- As rotas protegidas para professor ficaram disponiveis em:
  - `GET /api/ConteudosDidaticos`
  - `GET /api/ConteudosDidaticos/{id}`
  - `POST /api/ConteudosDidaticos`
  - `PUT /api/ConteudosDidaticos/{id}`
  - `DELETE /api/ConteudosDidaticos/{id}`
- Foram adicionadas rotas filtradas por professor autenticado para abastecer o workspace:
  - `GET /api/Cursos/meus`
  - `GET /api/Turmas/minhas`
  - `GET /api/Modulos/meus`
- A API valida:
  - professor autenticado
  - turma vinculada ao professor
  - modulo pertencente ao mesmo curso da turma
  - campos obrigatorios de acordo com o tipo do conteudo
- O `DevelopmentDataSeeder` passou a garantir modulos demo e um conteudo inicial para facilitar o uso da feature em ambiente local.

## Correcoes feitas no dia

- Foi corrigida a falha de inicializacao do servidor causada por `multiple cascade paths` no SQL Server durante a aplicacao das migrations.
- O mapeamento de exclusao em `TentativaAvaliacao -> Matricula` e `ProgressoConteudoAluno -> Matricula` foi ajustado para evitar queda da API no startup.
- A barra global da home publica deixou de depender de `sticky` e passou a operar com layout compensado para permanecer visivel durante a rolagem.

## Validacoes executadas

- `dotnet build /p:UseAppHost=false`
- `dotnet run --project "Sistema Academico Integrado.csproj" --launch-profile http`
- `npm.cmd run build`
- `GET /api/ConteudosDidaticos` autenticado com o professor demo
- `GET /api/Cursos/meus`, `GET /api/Turmas/minhas` e `GET /api/Modulos/meus` autenticados com o professor demo

## Estado atual

- O backend sobe normalmente em `http://localhost:5000`.
- A tela de gestao de modulos esta publicada e funcional no frontend.
- A home publica esta com a barra global fixa durante a rolagem.
- A tela de conteudos do professor esta publicada e integrada ao backend.

## Proximo passo sugerido

- Evoluir a experiencia do aluno para consumir os `ConteudoDidatico` publicados e refletir progresso por modulo.
