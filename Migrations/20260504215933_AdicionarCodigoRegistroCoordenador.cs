using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistema_Academico_Integrado.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCodigoRegistroCoordenador : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoRegistro",
                table: "Coordenadores",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE [Coordenadores]
                SET [CodigoRegistro] = CONCAT('COORD-', RIGHT(CONCAT('000000', CAST([Id] AS varchar(6))), 6))
                WHERE [CodigoRegistro] IS NULL OR LTRIM(RTRIM([CodigoRegistro])) = ''
                """);

            migrationBuilder.AlterColumn<string>(
                name: "CodigoRegistro",
                table: "Coordenadores",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Coordenadores_CodigoRegistro",
                table: "Coordenadores",
                column: "CodigoRegistro",
                unique: true,
                filter: "[CodigoRegistro] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Coordenadores_CodigoRegistro",
                table: "Coordenadores");

            migrationBuilder.DropColumn(
                name: "CodigoRegistro",
                table: "Coordenadores");
        }
    }
}
