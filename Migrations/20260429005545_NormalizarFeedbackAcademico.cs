using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistema_Academico_Integrado.Migrations
{
    /// <inheritdoc />
    public partial class NormalizarFeedbackAcademico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FeedbacksAcademicos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DestinatarioId = table.Column<int>(type: "int", nullable: false),
                    AutorId = table.Column<int>(type: "int", nullable: true),
                    Origem = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Mensagem = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Lido = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbacksAcademicos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeedbacksAcademicos_Usuarios_AutorId",
                        column: x => x.AutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FeedbacksAcademicos_Usuarios_DestinatarioId",
                        column: x => x.DestinatarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FeedbacksAcademicos_AutorId",
                table: "FeedbacksAcademicos",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedbacksAcademicos_DestinatarioId_CriadoEm",
                table: "FeedbacksAcademicos",
                columns: new[] { "DestinatarioId", "CriadoEm" });

            migrationBuilder.Sql(@"
                INSERT INTO [FeedbacksAcademicos] ([DestinatarioId], [AutorId], [Origem], [Mensagem], [CriadoEm], [Lido])
                SELECT
                    u.[Id],
                    NULL,
                    N'Historico do aluno',
                    LEFT(CONVERT(nvarchar(max), feedback.[value]), 1000),
                    SYSUTCDATETIME(),
                    CAST(0 AS bit)
                FROM [Usuarios] AS u
                CROSS APPLY OPENJSON(CASE WHEN ISJSON(u.[Aluno_Feedbacks]) = 1 THEN u.[Aluno_Feedbacks] ELSE N'[]' END) AS feedback
                WHERE feedback.[value] IS NOT NULL
                  AND CONVERT(nvarchar(max), feedback.[value]) <> N'';
            ");

            migrationBuilder.Sql(@"
                INSERT INTO [FeedbacksAcademicos] ([DestinatarioId], [AutorId], [Origem], [Mensagem], [CriadoEm], [Lido])
                SELECT
                    u.[Id],
                    NULL,
                    N'Historico do professor',
                    LEFT(CONVERT(nvarchar(max), feedback.[value]), 1000),
                    SYSUTCDATETIME(),
                    CAST(0 AS bit)
                FROM [Usuarios] AS u
                CROSS APPLY OPENJSON(CASE WHEN ISJSON(u.[Feedbacks]) = 1 THEN u.[Feedbacks] ELSE N'[]' END) AS feedback
                WHERE feedback.[value] IS NOT NULL
                  AND CONVERT(nvarchar(max), feedback.[value]) <> N'';
            ");

            migrationBuilder.DropColumn(
                name: "Aluno_Feedbacks",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Feedbacks",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TurmasAtribuidas",
                table: "Usuarios");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FeedbacksAcademicos");

            migrationBuilder.AddColumn<string>(
                name: "Aluno_Feedbacks",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Feedbacks",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TurmasAtribuidas",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
