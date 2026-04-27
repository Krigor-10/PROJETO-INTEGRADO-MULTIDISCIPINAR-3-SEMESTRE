using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sistema_Academico_Integrado.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCodigoRegistroAcademico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoRegistro",
                table: "Modulos",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoRegistro",
                table: "Cursos",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE [Cursos]
                SET [CodigoRegistro] = CONCAT('CUR-', RIGHT(CONCAT('000000', CAST((([Id] * 7919 + 104729) % 1000000) AS varchar(6))), 6))
                WHERE [CodigoRegistro] IS NULL OR [CodigoRegistro] = ''
                """);

            migrationBuilder.Sql("""
                UPDATE [Modulos]
                SET [CodigoRegistro] = CONCAT('MOD-', RIGHT(CONCAT('000000', CAST((([Id] * 104729 + 7919) % 1000000) AS varchar(6))), 6))
                WHERE [CodigoRegistro] IS NULL OR [CodigoRegistro] = ''
                """);

            migrationBuilder.AlterColumn<string>(
                name: "CodigoRegistro",
                table: "Modulos",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CodigoRegistro",
                table: "Cursos",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Modulos_CodigoRegistro",
                table: "Modulos",
                column: "CodigoRegistro",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cursos_CodigoRegistro",
                table: "Cursos",
                column: "CodigoRegistro",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Modulos_CodigoRegistro",
                table: "Modulos");

            migrationBuilder.DropIndex(
                name: "IX_Cursos_CodigoRegistro",
                table: "Cursos");

            migrationBuilder.DropColumn(
                name: "CodigoRegistro",
                table: "Modulos");

            migrationBuilder.DropColumn(
                name: "CodigoRegistro",
                table: "Cursos");
        }
    }
}
