using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistema_Academico_Integrado.Migrations
{
    /// <inheritdoc />
    public partial class AddPedagogicalCore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Avaliacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ProfessorAutorId = table.Column<int>(type: "int", nullable: false),
                    TurmaId = table.Column<int>(type: "int", nullable: false),
                    ModuloId = table.Column<int>(type: "int", nullable: false),
                    TipoAvaliacao = table.Column<int>(type: "int", nullable: false),
                    StatusPublicacao = table.Column<int>(type: "int", nullable: false),
                    DataAbertura = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataFechamento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TentativasPermitidas = table.Column<int>(type: "int", nullable: false),
                    TempoLimiteMinutos = table.Column<int>(type: "int", nullable: true),
                    NotaMaxima = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    PesoNota = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    PesoProgresso = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    PublicadoEm = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Avaliacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Avaliacoes_Modulos_ModuloId",
                        column: x => x.ModuloId,
                        principalTable: "Modulos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Avaliacoes_Turmas_TurmaId",
                        column: x => x.TurmaId,
                        principalTable: "Turmas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Avaliacoes_Usuarios_ProfessorAutorId",
                        column: x => x.ProfessorAutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConteudosDidaticos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TipoConteudo = table.Column<int>(type: "int", nullable: false),
                    CorpoTexto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ArquivoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    LinkUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ProfessorAutorId = table.Column<int>(type: "int", nullable: false),
                    TurmaId = table.Column<int>(type: "int", nullable: false),
                    ModuloId = table.Column<int>(type: "int", nullable: false),
                    StatusPublicacao = table.Column<int>(type: "int", nullable: false),
                    OrdemExibicao = table.Column<int>(type: "int", nullable: false),
                    PesoProgresso = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    PublicadoEm = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConteudosDidaticos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConteudosDidaticos_Modulos_ModuloId",
                        column: x => x.ModuloId,
                        principalTable: "Modulos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConteudosDidaticos_Turmas_TurmaId",
                        column: x => x.TurmaId,
                        principalTable: "Turmas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConteudosDidaticos_Usuarios_ProfessorAutorId",
                        column: x => x.ProfessorAutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MarcosProgressosAlunos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MatriculaId = table.Column<int>(type: "int", nullable: false),
                    Escopo = table.Column<int>(type: "int", nullable: false),
                    CursoId = table.Column<int>(type: "int", nullable: false),
                    ModuloId = table.Column<int>(type: "int", nullable: true),
                    Origem = table.Column<int>(type: "int", nullable: false),
                    PercentualMarco = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    ReferenciaId = table.Column<int>(type: "int", nullable: true),
                    GeradoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessadoEm = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Observacao = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarcosProgressosAlunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarcosProgressosAlunos_Cursos_CursoId",
                        column: x => x.CursoId,
                        principalTable: "Cursos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MarcosProgressosAlunos_Matriculas_MatriculaId",
                        column: x => x.MatriculaId,
                        principalTable: "Matriculas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MarcosProgressosAlunos_Modulos_ModuloId",
                        column: x => x.ModuloId,
                        principalTable: "Modulos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProgressosCursosAlunos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MatriculaId = table.Column<int>(type: "int", nullable: false),
                    CursoId = table.Column<int>(type: "int", nullable: false),
                    StatusProgresso = table.Column<int>(type: "int", nullable: false),
                    PercentualConclusao = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    PesoConcluido = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    PesoTotal = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    ModulosConcluidos = table.Column<int>(type: "int", nullable: false),
                    TotalModulos = table.Column<int>(type: "int", nullable: false),
                    MediaCurso = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgressosCursosAlunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgressosCursosAlunos_Cursos_CursoId",
                        column: x => x.CursoId,
                        principalTable: "Cursos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProgressosCursosAlunos_Matriculas_MatriculaId",
                        column: x => x.MatriculaId,
                        principalTable: "Matriculas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProgressosModulosAlunos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MatriculaId = table.Column<int>(type: "int", nullable: false),
                    ModuloId = table.Column<int>(type: "int", nullable: false),
                    StatusProgresso = table.Column<int>(type: "int", nullable: false),
                    PercentualConclusao = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    PesoConcluido = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    PesoTotal = table.Column<decimal>(type: "decimal(8,2)", precision: 8, scale: 2, nullable: false),
                    ConteudosConcluidos = table.Column<int>(type: "int", nullable: false),
                    TotalConteudos = table.Column<int>(type: "int", nullable: false),
                    AvaliacoesConcluidas = table.Column<int>(type: "int", nullable: false),
                    TotalAvaliacoes = table.Column<int>(type: "int", nullable: false),
                    MediaModulo = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgressosModulosAlunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgressosModulosAlunos_Matriculas_MatriculaId",
                        column: x => x.MatriculaId,
                        principalTable: "Matriculas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProgressosModulosAlunos_Modulos_ModuloId",
                        column: x => x.ModuloId,
                        principalTable: "Modulos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuestoesBanco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProfessorAutorId = table.Column<int>(type: "int", nullable: false),
                    TituloInterno = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
                    Contexto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Enunciado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoQuestao = table.Column<int>(type: "int", nullable: false),
                    Tema = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Subtema = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Dificuldade = table.Column<byte>(type: "tinyint", nullable: false),
                    ExplicacaoPosResposta = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ativa = table.Column<bool>(type: "bit", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestoesBanco", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestoesBanco_Usuarios_ProfessorAutorId",
                        column: x => x.ProfessorAutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TentativasAvaliacao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AvaliacaoId = table.Column<int>(type: "int", nullable: false),
                    MatriculaId = table.Column<int>(type: "int", nullable: false),
                    NumeroTentativa = table.Column<int>(type: "int", nullable: false),
                    StatusTentativa = table.Column<int>(type: "int", nullable: false),
                    IniciadaEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EnviadaEm = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CorrigidaEm = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NotaBruta = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TentativasAvaliacao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TentativasAvaliacao_Avaliacoes_AvaliacaoId",
                        column: x => x.AvaliacaoId,
                        principalTable: "Avaliacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TentativasAvaliacao_Matriculas_MatriculaId",
                        column: x => x.MatriculaId,
                        principalTable: "Matriculas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProgressosConteudosAlunos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MatriculaId = table.Column<int>(type: "int", nullable: false),
                    ConteudoDidaticoId = table.Column<int>(type: "int", nullable: false),
                    ModuloId = table.Column<int>(type: "int", nullable: false),
                    StatusProgresso = table.Column<int>(type: "int", nullable: false),
                    PercentualConclusao = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    PrimeiroAcessoEm = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UltimoAcessoEm = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ConcluidoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgressosConteudosAlunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgressosConteudosAlunos_ConteudosDidaticos_ConteudoDidaticoId",
                        column: x => x.ConteudoDidaticoId,
                        principalTable: "ConteudosDidaticos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProgressosConteudosAlunos_Matriculas_MatriculaId",
                        column: x => x.MatriculaId,
                        principalTable: "Matriculas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProgressosConteudosAlunos_Modulos_ModuloId",
                        column: x => x.ModuloId,
                        principalTable: "Modulos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AlternativasQuestoesBanco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestaoBancoId = table.Column<int>(type: "int", nullable: false),
                    Letra = table.Column<string>(type: "nvarchar(1)", maxLength: 1, nullable: false),
                    Texto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EhCorreta = table.Column<bool>(type: "bit", nullable: false),
                    Justificativa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlternativasQuestoesBanco", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlternativasQuestoesBanco_QuestoesBanco_QuestaoBancoId",
                        column: x => x.QuestaoBancoId,
                        principalTable: "QuestoesBanco",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AnexosQuestoesBanco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestaoBancoId = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    TipoAnexo = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    ArquivoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnexosQuestoesBanco", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnexosQuestoesBanco_QuestoesBanco_QuestaoBancoId",
                        column: x => x.QuestaoBancoId,
                        principalTable: "QuestoesBanco",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestoesPublicadas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AvaliacaoId = table.Column<int>(type: "int", nullable: false),
                    QuestaoBancoId = table.Column<int>(type: "int", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    ContextoSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EnunciadoSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoQuestao = table.Column<int>(type: "int", nullable: false),
                    ExplicacaoSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Pontos = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestoesPublicadas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestoesPublicadas_Avaliacoes_AvaliacaoId",
                        column: x => x.AvaliacaoId,
                        principalTable: "Avaliacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestoesPublicadas_QuestoesBanco_QuestaoBancoId",
                        column: x => x.QuestaoBancoId,
                        principalTable: "QuestoesBanco",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LancamentosNotasAlunos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MatriculaId = table.Column<int>(type: "int", nullable: false),
                    AvaliacaoId = table.Column<int>(type: "int", nullable: false),
                    ModuloId = table.Column<int>(type: "int", nullable: false),
                    TentativaAvaliacaoId = table.Column<int>(type: "int", nullable: true),
                    ProfessorResponsavelId = table.Column<int>(type: "int", nullable: true),
                    NotaOficial = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    PesoNota = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    OrigemCorrecao = table.Column<int>(type: "int", nullable: false),
                    LiberadaAoAlunoEm = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FeedbackProfessor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LancamentosNotasAlunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LancamentosNotasAlunos_Avaliacoes_AvaliacaoId",
                        column: x => x.AvaliacaoId,
                        principalTable: "Avaliacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LancamentosNotasAlunos_Matriculas_MatriculaId",
                        column: x => x.MatriculaId,
                        principalTable: "Matriculas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LancamentosNotasAlunos_Modulos_ModuloId",
                        column: x => x.ModuloId,
                        principalTable: "Modulos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LancamentosNotasAlunos_TentativasAvaliacao_TentativaAvaliacaoId",
                        column: x => x.TentativaAvaliacaoId,
                        principalTable: "TentativasAvaliacao",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LancamentosNotasAlunos_Usuarios_ProfessorResponsavelId",
                        column: x => x.ProfessorResponsavelId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AlternativasQuestoesPublicadas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestaoPublicadaId = table.Column<int>(type: "int", nullable: false),
                    Letra = table.Column<string>(type: "nvarchar(1)", maxLength: 1, nullable: false),
                    Texto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EhCorreta = table.Column<bool>(type: "bit", nullable: false),
                    JustificativaSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlternativasQuestoesPublicadas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlternativasQuestoesPublicadas_QuestoesPublicadas_QuestaoPublicadaId",
                        column: x => x.QuestaoPublicadaId,
                        principalTable: "QuestoesPublicadas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RespostasAlunos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TentativaAvaliacaoId = table.Column<int>(type: "int", nullable: false),
                    QuestaoPublicadaId = table.Column<int>(type: "int", nullable: false),
                    AlternativaQuestaoPublicadaId = table.Column<int>(type: "int", nullable: true),
                    RespostaTexto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Correta = table.Column<bool>(type: "bit", nullable: true),
                    PontosObtidos = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: false),
                    RespondidaEm = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RespostasAlunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RespostasAlunos_AlternativasQuestoesPublicadas_AlternativaQuestaoPublicadaId",
                        column: x => x.AlternativaQuestaoPublicadaId,
                        principalTable: "AlternativasQuestoesPublicadas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RespostasAlunos_QuestoesPublicadas_QuestaoPublicadaId",
                        column: x => x.QuestaoPublicadaId,
                        principalTable: "QuestoesPublicadas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RespostasAlunos_TentativasAvaliacao_TentativaAvaliacaoId",
                        column: x => x.TentativaAvaliacaoId,
                        principalTable: "TentativasAvaliacao",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlternativasQuestoesBanco_QuestaoBancoId_Letra",
                table: "AlternativasQuestoesBanco",
                columns: new[] { "QuestaoBancoId", "Letra" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AlternativasQuestoesPublicadas_QuestaoPublicadaId_Letra",
                table: "AlternativasQuestoesPublicadas",
                columns: new[] { "QuestaoPublicadaId", "Letra" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnexosQuestoesBanco_QuestaoBancoId",
                table: "AnexosQuestoesBanco",
                column: "QuestaoBancoId");

            migrationBuilder.CreateIndex(
                name: "IX_Avaliacoes_ModuloId",
                table: "Avaliacoes",
                column: "ModuloId");

            migrationBuilder.CreateIndex(
                name: "IX_Avaliacoes_ProfessorAutorId",
                table: "Avaliacoes",
                column: "ProfessorAutorId");

            migrationBuilder.CreateIndex(
                name: "IX_Avaliacoes_TurmaId",
                table: "Avaliacoes",
                column: "TurmaId");

            migrationBuilder.CreateIndex(
                name: "IX_ConteudosDidaticos_ModuloId",
                table: "ConteudosDidaticos",
                column: "ModuloId");

            migrationBuilder.CreateIndex(
                name: "IX_ConteudosDidaticos_ProfessorAutorId",
                table: "ConteudosDidaticos",
                column: "ProfessorAutorId");

            migrationBuilder.CreateIndex(
                name: "IX_ConteudosDidaticos_TurmaId",
                table: "ConteudosDidaticos",
                column: "TurmaId");

            migrationBuilder.CreateIndex(
                name: "IX_LancamentosNotasAlunos_AvaliacaoId",
                table: "LancamentosNotasAlunos",
                column: "AvaliacaoId");

            migrationBuilder.CreateIndex(
                name: "IX_LancamentosNotasAlunos_MatriculaId_AvaliacaoId",
                table: "LancamentosNotasAlunos",
                columns: new[] { "MatriculaId", "AvaliacaoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LancamentosNotasAlunos_ModuloId",
                table: "LancamentosNotasAlunos",
                column: "ModuloId");

            migrationBuilder.CreateIndex(
                name: "IX_LancamentosNotasAlunos_ProfessorResponsavelId",
                table: "LancamentosNotasAlunos",
                column: "ProfessorResponsavelId");

            migrationBuilder.CreateIndex(
                name: "IX_LancamentosNotasAlunos_TentativaAvaliacaoId",
                table: "LancamentosNotasAlunos",
                column: "TentativaAvaliacaoId");

            migrationBuilder.CreateIndex(
                name: "IX_MarcosProgressosAlunos_CursoId",
                table: "MarcosProgressosAlunos",
                column: "CursoId");

            migrationBuilder.CreateIndex(
                name: "IX_MarcosProgressosAlunos_MatriculaId_Escopo_CursoId_ModuloId_PercentualMarco",
                table: "MarcosProgressosAlunos",
                columns: new[] { "MatriculaId", "Escopo", "CursoId", "ModuloId", "PercentualMarco" });

            migrationBuilder.CreateIndex(
                name: "IX_MarcosProgressosAlunos_ModuloId",
                table: "MarcosProgressosAlunos",
                column: "ModuloId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressosConteudosAlunos_ConteudoDidaticoId",
                table: "ProgressosConteudosAlunos",
                column: "ConteudoDidaticoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressosConteudosAlunos_MatriculaId_ConteudoDidaticoId",
                table: "ProgressosConteudosAlunos",
                columns: new[] { "MatriculaId", "ConteudoDidaticoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProgressosConteudosAlunos_ModuloId",
                table: "ProgressosConteudosAlunos",
                column: "ModuloId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressosCursosAlunos_CursoId",
                table: "ProgressosCursosAlunos",
                column: "CursoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressosCursosAlunos_MatriculaId_CursoId",
                table: "ProgressosCursosAlunos",
                columns: new[] { "MatriculaId", "CursoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProgressosModulosAlunos_MatriculaId_ModuloId",
                table: "ProgressosModulosAlunos",
                columns: new[] { "MatriculaId", "ModuloId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProgressosModulosAlunos_ModuloId",
                table: "ProgressosModulosAlunos",
                column: "ModuloId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestoesBanco_ProfessorAutorId",
                table: "QuestoesBanco",
                column: "ProfessorAutorId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestoesPublicadas_AvaliacaoId_Ordem",
                table: "QuestoesPublicadas",
                columns: new[] { "AvaliacaoId", "Ordem" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestoesPublicadas_QuestaoBancoId",
                table: "QuestoesPublicadas",
                column: "QuestaoBancoId");

            migrationBuilder.CreateIndex(
                name: "IX_RespostasAlunos_AlternativaQuestaoPublicadaId",
                table: "RespostasAlunos",
                column: "AlternativaQuestaoPublicadaId");

            migrationBuilder.CreateIndex(
                name: "IX_RespostasAlunos_QuestaoPublicadaId",
                table: "RespostasAlunos",
                column: "QuestaoPublicadaId");

            migrationBuilder.CreateIndex(
                name: "IX_RespostasAlunos_TentativaAvaliacaoId_QuestaoPublicadaId",
                table: "RespostasAlunos",
                columns: new[] { "TentativaAvaliacaoId", "QuestaoPublicadaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TentativasAvaliacao_AvaliacaoId",
                table: "TentativasAvaliacao",
                column: "AvaliacaoId");

            migrationBuilder.CreateIndex(
                name: "IX_TentativasAvaliacao_MatriculaId_AvaliacaoId_NumeroTentativa",
                table: "TentativasAvaliacao",
                columns: new[] { "MatriculaId", "AvaliacaoId", "NumeroTentativa" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlternativasQuestoesBanco");

            migrationBuilder.DropTable(
                name: "AnexosQuestoesBanco");

            migrationBuilder.DropTable(
                name: "LancamentosNotasAlunos");

            migrationBuilder.DropTable(
                name: "MarcosProgressosAlunos");

            migrationBuilder.DropTable(
                name: "ProgressosConteudosAlunos");

            migrationBuilder.DropTable(
                name: "ProgressosCursosAlunos");

            migrationBuilder.DropTable(
                name: "ProgressosModulosAlunos");

            migrationBuilder.DropTable(
                name: "RespostasAlunos");

            migrationBuilder.DropTable(
                name: "ConteudosDidaticos");

            migrationBuilder.DropTable(
                name: "AlternativasQuestoesPublicadas");

            migrationBuilder.DropTable(
                name: "TentativasAvaliacao");

            migrationBuilder.DropTable(
                name: "QuestoesPublicadas");

            migrationBuilder.DropTable(
                name: "Avaliacoes");

            migrationBuilder.DropTable(
                name: "QuestoesBanco");
        }
    }
}
