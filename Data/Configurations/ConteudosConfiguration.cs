using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Data.Configurations;

public sealed class ConteudoDidaticoConfiguration : IEntityTypeConfiguration<ConteudoDidatico>
{
    public void Configure(EntityTypeBuilder<ConteudoDidatico> builder)
    {
        builder
            .HasOne(c => c.ProfessorAutor)
            .WithMany(p => p.ConteudosDidaticos)
            .HasForeignKey(c => c.ProfessorAutorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(c => c.Turma)
            .WithMany(t => t.ConteudosDidaticos)
            .HasForeignKey(c => c.TurmaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(c => c.Modulo)
            .WithMany(m => m.ConteudosDidaticos)
            .HasForeignKey(c => c.ModuloId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .Property(c => c.CorpoTexto)
            .HasColumnType("nvarchar(max)");

        builder
            .Property(c => c.PesoProgresso)
            .HasPrecision(6, 2);
    }
}
