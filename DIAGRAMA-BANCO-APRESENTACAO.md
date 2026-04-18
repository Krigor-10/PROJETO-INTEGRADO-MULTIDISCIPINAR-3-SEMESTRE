# Diagrama do Banco para Apresentacao

Atualizado em: 2026-04-15

## Objetivo

Este arquivo resume como o banco esta organizado hoje no projeto `Sistema Academico Integrado`, com foco em:

- identidade e perfis
- estrutura academica
- publicacao de conteudo e avaliacoes
- notas e progresso do aluno

## Ponto estrutural principal

O projeto usa heranca TPH (table-per-hierarchy) para usuarios. Na pratica, `Aluno`, `Professor`, `Coordenador` e `Admin` vivem fisicamente na tabela `Usuarios`, diferenciados pela coluna `TipoUsuario`.

## Diagrama 1 - Perfis e estrutura academica

```mermaid
flowchart TB
    U["Usuarios\nTabela unica com TipoUsuario"]
    A["Aluno"]
    P["Professor"]
    C["Coordenador"]
    AD["Admin"]

    U --> A
    U --> P
    U --> C
    U --> AD
```

```mermaid
erDiagram
    Usuarios {
      int Id PK
      string TipoUsuario
      string Nome
      string Email
      string Cpf
      string SenhaHash
      bool Ativo
    }

    Cursos {
      int Id PK
      string Titulo
      decimal Preco
      int CoordenadorId FK
      int CriadoPor FK
    }

    Modulos {
      int Id PK
      int CursoId FK
      string Titulo
      datetime DataCriacao
    }

    Turmas {
      int Id PK
      int CursoId FK
      int ProfessorId FK
      string NomeTurma
      datetime DataCriacao
    }

    Matriculas {
      int Id PK
      int AlunoId FK
      int CursoId FK
      int TurmaId FK
      int Status
      decimal NotaFinal
      datetime DataSolicitacao
    }

    Usuarios ||--o{ Cursos : "coordena ou cria"
    Cursos ||--o{ Modulos : "possui"
    Cursos ||--o{ Turmas : "abre"
    Usuarios ||--o{ Turmas : "professor responsavel"
    Usuarios ||--o{ Matriculas : "aluno"
    Cursos ||--o{ Matriculas : "curso solicitado"
    Turmas o|--o{ Matriculas : "alocacao opcional"
```

## Diagrama 2 - Nucleo pedagogico, notas e progresso

```mermaid
erDiagram
    Usuarios {
      int Id PK
      string TipoUsuario
    }

    Modulos {
      int Id PK
      int CursoId FK
    }

    Turmas {
      int Id PK
      int CursoId FK
      int ProfessorId FK
    }

    Matriculas {
      int Id PK
      int AlunoId FK
      int CursoId FK
      int TurmaId FK
    }

    ConteudosDidaticos {
      int Id PK
      int ProfessorAutorId FK
      int TurmaId FK
      int ModuloId FK
      int TipoConteudo
      int StatusPublicacao
      decimal PesoProgresso
    }

    Avaliacoes {
      int Id PK
      int ProfessorAutorId FK
      int TurmaId FK
      int ModuloId FK
      int TipoAvaliacao
      int StatusPublicacao
      decimal NotaMaxima
      decimal PesoNota
      decimal PesoProgresso
    }

    QuestoesBanco {
      int Id PK
      int ProfessorAutorId FK
      int TipoQuestao
      string TituloInterno
      bool Ativa
    }

    AlternativasQuestoesBanco {
      int Id PK
      int QuestaoBancoId FK
      string Letra
      bool EhCorreta
    }

    AnexosQuestoesBanco {
      int Id PK
      int QuestaoBancoId FK
      string TipoAnexo
      string ArquivoUrl
    }

    QuestoesPublicadas {
      int Id PK
      int AvaliacaoId FK
      int QuestaoBancoId FK
      int Ordem
      decimal Pontos
    }

    AlternativasQuestoesPublicadas {
      int Id PK
      int QuestaoPublicadaId FK
      string Letra
      bool EhCorreta
    }

    TentativasAvaliacao {
      int Id PK
      int AvaliacaoId FK
      int MatriculaId FK
      int NumeroTentativa
      int StatusTentativa
      decimal NotaBruta
    }

    RespostasAlunos {
      int Id PK
      int TentativaAvaliacaoId FK
      int QuestaoPublicadaId FK
      int AlternativaQuestaoPublicadaId FK
      bool Correta
      decimal PontosObtidos
    }

    LancamentosNotasAlunos {
      int Id PK
      int MatriculaId FK
      int AvaliacaoId FK
      int ModuloId FK
      int TentativaAvaliacaoId FK
      int ProfessorResponsavelId FK
      decimal NotaOficial
    }

    ProgressosConteudosAlunos {
      int Id PK
      int MatriculaId FK
      int ConteudoDidaticoId FK
      int ModuloId FK
      decimal PercentualConclusao
      int StatusProgresso
    }

    ProgressosModulosAlunos {
      int Id PK
      int MatriculaId FK
      int ModuloId FK
      decimal PercentualConclusao
      decimal MediaModulo
    }

    ProgressosCursosAlunos {
      int Id PK
      int MatriculaId FK
      int CursoId FK
      decimal PercentualConclusao
      decimal MediaCurso
    }

    MarcosProgressosAlunos {
      int Id PK
      int MatriculaId FK
      int CursoId FK
      int ModuloId FK
      int Escopo
      decimal PercentualMarco
    }

    Usuarios ||--o{ ConteudosDidaticos : "professor autor"
    Usuarios ||--o{ Avaliacoes : "professor autor"
    Usuarios ||--o{ QuestoesBanco : "professor autor"
    Usuarios o|--o{ LancamentosNotasAlunos : "professor responsavel"

    Turmas ||--o{ ConteudosDidaticos : "publica para"
    Modulos ||--o{ ConteudosDidaticos : "organiza"

    Turmas ||--o{ Avaliacoes : "aplica em"
    Modulos ||--o{ Avaliacoes : "pertence a"

    QuestoesBanco ||--o{ AlternativasQuestoesBanco : "possui"
    QuestoesBanco ||--o{ AnexosQuestoesBanco : "possui"
    QuestoesBanco ||--o{ QuestoesPublicadas : "origina snapshot"
    Avaliacoes ||--o{ QuestoesPublicadas : "publica"
    QuestoesPublicadas ||--o{ AlternativasQuestoesPublicadas : "congela alternativas"

    Matriculas ||--o{ TentativasAvaliacao : "gera"
    Avaliacoes ||--o{ TentativasAvaliacao : "recebe"
    TentativasAvaliacao ||--o{ RespostasAlunos : "registra"
    QuestoesPublicadas ||--o{ RespostasAlunos : "respondida em"
    AlternativasQuestoesPublicadas o|--o{ RespostasAlunos : "opcao objetiva"

    Matriculas ||--o{ LancamentosNotasAlunos : "fecha nota"
    Avaliacoes ||--o{ LancamentosNotasAlunos : "resultado"
    Modulos ||--o{ LancamentosNotasAlunos : "compila"

    Matriculas ||--o{ ProgressosConteudosAlunos : "acompanha"
    ConteudosDidaticos ||--o{ ProgressosConteudosAlunos : "consumo"
    Modulos ||--o{ ProgressosConteudosAlunos : "resume em"

    Matriculas ||--o{ ProgressosModulosAlunos : "agrega"
    Modulos ||--o{ ProgressosModulosAlunos : "resume"

    Matriculas ||--o{ ProgressosCursosAlunos : "agrega"
    Cursos ||--o{ ProgressosCursosAlunos : "resume"

    Matriculas ||--o{ MarcosProgressosAlunos : "marca"
    Cursos ||--o{ MarcosProgressosAlunos : "escopo curso"
    Modulos o|--o{ MarcosProgressosAlunos : "escopo modulo"
```

## Como explicar o banco na apresentacao

1. O cadastro de acesso parte de `Usuarios`, usando `TipoUsuario` para separar aluno, professor, coordenador e admin na mesma tabela fisica.
2. `Cursos` definem o catalogo principal. Cada curso pode ter um coordenador responsavel e um admin criador.
3. `Modulos` organizam o conteudo interno de cada curso.
4. `Turmas` representam a oferta operacional do curso e ligam o curso a um professor responsavel.
5. `Matriculas` conectam o aluno ao curso e, quando houver alocacao, tambem a uma turma especifica.
6. O professor publica `ConteudosDidaticos` e `Avaliacoes` sempre no contexto de uma turma e de um modulo.
7. O banco de questoes fica em `QuestoesBanco`, com alternativas e anexos reutilizaveis. Quando uma avaliacao e montada, as questoes entram em `QuestoesPublicadas` para congelar o snapshot usado naquela prova ou quiz.
8. O aluno realiza a avaliacao por meio de `TentativasAvaliacao`, e cada resposta fica em `RespostasAlunos`.
9. A nota oficial consolidada da avaliacao fica em `LancamentosNotasAlunos`.
10. O acompanhamento pedagogico fica espalhado em tres niveis: `ProgressosConteudosAlunos`, `ProgressosModulosAlunos` e `ProgressosCursosAlunos`, com `MarcosProgressosAlunos` registrando eventos relevantes de avancos percentuais.

## Regras de integridade importantes

- `Usuarios` concentra todos os perfis. As regras de papel dependem da aplicacao e do valor de `TipoUsuario`.
- `Turmas` possuem indice unico por `NomeTurma + CursoId`.
- `Modulos` possuem indice unico por `CursoId + Titulo`.
- `AlternativasQuestoesBanco` possuem indice unico por `QuestaoBancoId + Letra`.
- `AlternativasQuestoesPublicadas` possuem indice unico por `QuestaoPublicadaId + Letra`.
- `QuestoesPublicadas` possuem indice unico por `AvaliacaoId + Ordem`.
- `TentativasAvaliacao` possuem indice unico por `MatriculaId + AvaliacaoId + NumeroTentativa`.
- `RespostasAlunos` possuem indice unico por `TentativaAvaliacaoId + QuestaoPublicadaId`.
- `LancamentosNotasAlunos` possuem indice unico por `MatriculaId + AvaliacaoId`.
- `ProgressosConteudosAlunos` possuem indice unico por `MatriculaId + ConteudoDidaticoId`.
- `ProgressosModulosAlunos` possuem indice unico por `MatriculaId + ModuloId`.
- `ProgressosCursosAlunos` possuem indice unico por `MatriculaId + CursoId`.

## Observacoes sobre delete behavior

- O projeto usa uma combinacao de `Cascade` e `Restrict` para evitar `multiple cascade paths` no SQL Server.
- `Matricula -> Turma` usa `Restrict`.
- `ConteudoDidatico -> Modulo` usa `Restrict`, enquanto `ConteudoDidatico -> Turma` usa `Cascade`.
- `Avaliacao -> Modulo` usa `Restrict`, enquanto `Avaliacao -> Turma` usa `Cascade`.
- `TentativaAvaliacao -> Matricula` usa `Restrict`.
- `ProgressoConteudoAluno -> Matricula` usa `Restrict`.

## Roteiro curto para apresentacao

1. Comece pela tabela `Usuarios`, explicando que todos os perfis vivem na mesma base e sao diferenciados por `TipoUsuario`.
2. Mostre que `Cursos`, `Modulos` e `Turmas` formam a estrutura academica principal.
3. Explique que `Matriculas` e a tabela que conecta o aluno ao curso e, quando necessario, a uma turma.
4. Mostre que o professor publica `ConteudosDidaticos` e `Avaliacoes` sempre ligados a `Turma` e `Modulo`.
5. Feche com a jornada do aluno: `TentativasAvaliacao`, `RespostasAlunos`, `LancamentosNotasAlunos` e as tabelas de progresso.
