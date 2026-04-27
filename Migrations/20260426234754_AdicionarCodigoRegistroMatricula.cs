using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistema_Academico_Integrado.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCodigoRegistroMatricula : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoRegistro",
                table: "Matriculas",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE [Matriculas]
                SET [CodigoRegistro] = CONCAT('MAT-', RIGHT(CONCAT('000000', CAST((([Id] * 13007 + 65537) % 1000000) AS varchar(6))), 6))
                WHERE [CodigoRegistro] IS NULL OR [CodigoRegistro] = ''
                """);

            migrationBuilder.AlterColumn<string>(
                name: "CodigoRegistro",
                table: "Matriculas",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Matriculas_CodigoRegistro",
                table: "Matriculas",
                column: "CodigoRegistro",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Matriculas_CodigoRegistro",
                table: "Matriculas");

            migrationBuilder.DropColumn(
                name: "CodigoRegistro",
                table: "Matriculas");
        }
    }
}
