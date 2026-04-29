using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Data.Configurations;

public sealed class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder
            .HasDiscriminator<string>("TipoUsuario")
            .HasValue<Aluno>("Aluno")
            .HasValue<Professor>("Professor")
            .HasValue<Coordenador>("Coordenador")
            .HasValue<Admin>("Admin");
    }
}

public sealed class ProfessorConfiguration : IEntityTypeConfiguration<Professor>
{
    public void Configure(EntityTypeBuilder<Professor> builder)
    {
        builder
            .Property(p => p.CodigoRegistro)
            .HasMaxLength(16);

        builder
            .HasIndex(p => p.CodigoRegistro)
            .IsUnique()
            .HasFilter("[TipoUsuario] = N'Professor' AND [CodigoRegistro] IS NOT NULL");
    }
}

public sealed class FeedbackAcademicoConfiguration : IEntityTypeConfiguration<FeedbackAcademico>
{
    public void Configure(EntityTypeBuilder<FeedbackAcademico> builder)
    {
        builder
            .Property(f => f.Origem)
            .HasMaxLength(120)
            .IsRequired();

        builder
            .Property(f => f.Mensagem)
            .HasMaxLength(1000)
            .IsRequired();

        builder
            .HasOne(f => f.Destinatario)
            .WithMany(u => u.FeedbacksRecebidos)
            .HasForeignKey(f => f.DestinatarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(f => f.Autor)
            .WithMany(u => u.FeedbacksEnviados)
            .HasForeignKey(f => f.AutorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasIndex(f => new { f.DestinatarioId, f.CriadoEm });
    }
}
