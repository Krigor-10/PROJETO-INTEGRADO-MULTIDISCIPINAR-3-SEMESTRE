using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistema_Academico_Integrado.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCodigoRegistroTurma : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoRegistro",
                table: "Turmas",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE [Turmas]
                SET [CodigoRegistro] = CONCAT('TUR-', RIGHT(CONCAT('000000', CAST((([Id] * 15485863 + 32452843) % 1000000) AS varchar(6))), 6))
                WHERE [CodigoRegistro] IS NULL OR [CodigoRegistro] = ''
                """);

            migrationBuilder.AlterColumn<string>(
                name: "CodigoRegistro",
                table: "Turmas",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Turmas_CodigoRegistro",
                table: "Turmas",
                column: "CodigoRegistro",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Turmas_CodigoRegistro",
                table: "Turmas");

            migrationBuilder.DropColumn(
                name: "CodigoRegistro",
                table: "Turmas");
        }
    }
}
