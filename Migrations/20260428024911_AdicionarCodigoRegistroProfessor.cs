using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistema_Academico_Integrado.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCodigoRegistroProfessor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoRegistro",
                table: "Usuarios",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE [Usuarios]
                SET [CodigoRegistro] = CONCAT('PROF-', RIGHT(CONCAT('000000', CAST((([Id] * 7919 + 524287) % 1000000) AS varchar(6))), 6))
                WHERE [TipoUsuario] = N'Professor'
                  AND ([CodigoRegistro] IS NULL OR [CodigoRegistro] = '')
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_CodigoRegistro",
                table: "Usuarios",
                column: "CodigoRegistro",
                unique: true,
                filter: "[TipoUsuario] = N'Professor' AND [CodigoRegistro] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Usuarios_CodigoRegistro",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "CodigoRegistro",
                table: "Usuarios");
        }
    }
}
