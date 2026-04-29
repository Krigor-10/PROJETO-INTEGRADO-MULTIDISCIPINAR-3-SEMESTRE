using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistema_Academico_Integrado.Migrations
{
    /// <inheritdoc />
    public partial class NormalizarPerfisUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            DropForeignKeyIfExists(migrationBuilder, "Avaliacoes", "FK_Avaliacoes_Usuarios_ProfessorAutorId");
            DropForeignKeyIfExists(migrationBuilder, "ConteudosDidaticos", "FK_ConteudosDidaticos_Usuarios_ProfessorAutorId");
            DropForeignKeyIfExists(migrationBuilder, "Cursos", "FK_Cursos_Usuarios_CoordenadorId");
            DropForeignKeyIfExists(migrationBuilder, "Cursos", "FK_Cursos_Usuarios_CriadoPor");
            DropForeignKeyIfExists(migrationBuilder, "LancamentosNotasAlunos", "FK_LancamentosNotasAlunos_Usuarios_ProfessorResponsavelId");
            DropForeignKeyIfExists(migrationBuilder, "Matriculas", "FK_Matriculas_Usuarios_AlunoId");
            DropForeignKeyIfExists(migrationBuilder, "QuestoesBanco", "FK_QuestoesBanco_Usuarios_ProfessorAutorId");
            DropForeignKeyIfExists(migrationBuilder, "Turmas", "FK_Turmas_Usuarios_ProfessorId");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_CodigoRegistro",
                table: "Usuarios");

            migrationBuilder.AlterColumn<string>(
                name: "TipoUsuario",
                table: "Usuarios",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(13)",
                oldMaxLength: 13);

            migrationBuilder.CreateTable(
                name: "Admins",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Admins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Admins_Usuarios_Id",
                        column: x => x.Id,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Alunos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Matricula = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TurmaAtual = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alunos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Alunos_Usuarios_Id",
                        column: x => x.Id,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Coordenadores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CursoResponsavel = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coordenadores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Coordenadores_Usuarios_Id",
                        column: x => x.Id,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Professores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    CodigoRegistro = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Especialidade = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Professores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Professores_Usuarios_Id",
                        column: x => x.Id,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"
                INSERT INTO [Admins] ([Id])
                SELECT [Id]
                FROM [Usuarios]
                WHERE [TipoUsuario] = N'Admin';
            ");

            migrationBuilder.Sql(@"
                INSERT INTO [Alunos] ([Id], [Matricula], [TurmaAtual])
                SELECT
                    [Id],
                    COALESCE([Matricula], N''),
                    COALESCE([TurmaAtual], N'Nao atribuida')
                FROM [Usuarios]
                WHERE [TipoUsuario] = N'Aluno';
            ");

            migrationBuilder.Sql(@"
                INSERT INTO [Coordenadores] ([Id], [CursoResponsavel])
                SELECT [Id], [CursoResponsavel]
                FROM [Usuarios]
                WHERE [TipoUsuario] = N'Coordenador';
            ");

            migrationBuilder.Sql(@"
                INSERT INTO [Professores] ([Id], [CodigoRegistro], [Especialidade])
                SELECT
                    [Id],
                    COALESCE(NULLIF([CodigoRegistro], N''), CONCAT(N'PROFMIG-', RIGHT(CONCAT(N'00000000', [Id]), 8))),
                    LEFT(COALESCE(NULLIF([Especialidade], N''), N'Nao informada'), 120)
                FROM [Usuarios]
                WHERE [TipoUsuario] = N'Professor';
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Professores_CodigoRegistro",
                table: "Professores",
                column: "CodigoRegistro",
                unique: true,
                filter: "[CodigoRegistro] IS NOT NULL");

            migrationBuilder.DropColumn(
                name: "CodigoRegistro",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "CursoResponsavel",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Especialidade",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Matricula",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TurmaAtual",
                table: "Usuarios");

            migrationBuilder.AddForeignKey(
                name: "FK_Avaliacoes_Professores_ProfessorAutorId",
                table: "Avaliacoes",
                column: "ProfessorAutorId",
                principalTable: "Professores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ConteudosDidaticos_Professores_ProfessorAutorId",
                table: "ConteudosDidaticos",
                column: "ProfessorAutorId",
                principalTable: "Professores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Cursos_Admins_CriadoPor",
                table: "Cursos",
                column: "CriadoPor",
                principalTable: "Admins",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Cursos_Coordenadores_CoordenadorId",
                table: "Cursos",
                column: "CoordenadorId",
                principalTable: "Coordenadores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LancamentosNotasAlunos_Professores_ProfessorResponsavelId",
                table: "LancamentosNotasAlunos",
                column: "ProfessorResponsavelId",
                principalTable: "Professores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Matriculas_Alunos_AlunoId",
                table: "Matriculas",
                column: "AlunoId",
                principalTable: "Alunos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestoesBanco_Professores_ProfessorAutorId",
                table: "QuestoesBanco",
                column: "ProfessorAutorId",
                principalTable: "Professores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Turmas_Professores_ProfessorId",
                table: "Turmas",
                column: "ProfessorId",
                principalTable: "Professores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            DropForeignKeyIfExists(migrationBuilder, "Avaliacoes", "FK_Avaliacoes_Professores_ProfessorAutorId");
            DropForeignKeyIfExists(migrationBuilder, "ConteudosDidaticos", "FK_ConteudosDidaticos_Professores_ProfessorAutorId");
            DropForeignKeyIfExists(migrationBuilder, "Cursos", "FK_Cursos_Admins_CriadoPor");
            DropForeignKeyIfExists(migrationBuilder, "Cursos", "FK_Cursos_Coordenadores_CoordenadorId");
            DropForeignKeyIfExists(migrationBuilder, "LancamentosNotasAlunos", "FK_LancamentosNotasAlunos_Professores_ProfessorResponsavelId");
            DropForeignKeyIfExists(migrationBuilder, "Matriculas", "FK_Matriculas_Alunos_AlunoId");
            DropForeignKeyIfExists(migrationBuilder, "QuestoesBanco", "FK_QuestoesBanco_Professores_ProfessorAutorId");
            DropForeignKeyIfExists(migrationBuilder, "Turmas", "FK_Turmas_Professores_ProfessorId");

            migrationBuilder.AddColumn<string>(
                name: "CodigoRegistro",
                table: "Usuarios",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CursoResponsavel",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Especialidade",
                table: "Usuarios",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Matricula",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TurmaAtual",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE u
                SET
                    u.[Matricula] = a.[Matricula],
                    u.[TurmaAtual] = a.[TurmaAtual]
                FROM [Usuarios] AS u
                INNER JOIN [Alunos] AS a ON a.[Id] = u.[Id];
            ");

            migrationBuilder.Sql(@"
                UPDATE u
                SET u.[CursoResponsavel] = c.[CursoResponsavel]
                FROM [Usuarios] AS u
                INNER JOIN [Coordenadores] AS c ON c.[Id] = u.[Id];
            ");

            migrationBuilder.Sql(@"
                UPDATE u
                SET
                    u.[CodigoRegistro] = p.[CodigoRegistro],
                    u.[Especialidade] = p.[Especialidade]
                FROM [Usuarios] AS u
                INNER JOIN [Professores] AS p ON p.[Id] = u.[Id];
            ");

            migrationBuilder.DropTable(
                name: "Admins");

            migrationBuilder.DropTable(
                name: "Alunos");

            migrationBuilder.DropTable(
                name: "Coordenadores");

            migrationBuilder.DropTable(
                name: "Professores");

            migrationBuilder.AlterColumn<string>(
                name: "TipoUsuario",
                table: "Usuarios",
                type: "nvarchar(13)",
                maxLength: 13,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(40)",
                oldMaxLength: 40);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_CodigoRegistro",
                table: "Usuarios",
                column: "CodigoRegistro",
                unique: true,
                filter: "[TipoUsuario] = N'Professor' AND [CodigoRegistro] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Avaliacoes_Usuarios_ProfessorAutorId",
                table: "Avaliacoes",
                column: "ProfessorAutorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ConteudosDidaticos_Usuarios_ProfessorAutorId",
                table: "ConteudosDidaticos",
                column: "ProfessorAutorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Cursos_Usuarios_CoordenadorId",
                table: "Cursos",
                column: "CoordenadorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Cursos_Usuarios_CriadoPor",
                table: "Cursos",
                column: "CriadoPor",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LancamentosNotasAlunos_Usuarios_ProfessorResponsavelId",
                table: "LancamentosNotasAlunos",
                column: "ProfessorResponsavelId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Matriculas_Usuarios_AlunoId",
                table: "Matriculas",
                column: "AlunoId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestoesBanco_Usuarios_ProfessorAutorId",
                table: "QuestoesBanco",
                column: "ProfessorAutorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Turmas_Usuarios_ProfessorId",
                table: "Turmas",
                column: "ProfessorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        private static void DropForeignKeyIfExists(MigrationBuilder migrationBuilder, string tableName, string foreignKeyName)
        {
            migrationBuilder.Sql($@"
                IF OBJECT_ID(N'[{foreignKeyName}]', N'F') IS NOT NULL
                BEGIN
                    ALTER TABLE [{tableName}] DROP CONSTRAINT [{foreignKeyName}];
                END
            ");
        }
    }
}
