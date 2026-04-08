using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Data;

public class PlataformaContext : DbContext
{
    public PlataformaContext(DbContextOptions<PlataformaContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Aluno> Alunos { get; set; }
    public DbSet<Professor> Professores { get; set; }
    public DbSet<Coordenador> Coordenadores { get; set; }
    public DbSet<Admin> Admins { get; set; }
    public DbSet<Curso> Cursos { get; set; }
    public DbSet<Modulo> Modulos { get; set; }
    public DbSet<Turma> Turmas { get; set; }
    public DbSet<Matricula> Matriculas { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Usuario>()
            .HasDiscriminator<string>("TipoUsuario")
            .HasValue<Aluno>("Aluno")
            .HasValue<Professor>("Professor")
            .HasValue<Coordenador>("Coordenador")
            .HasValue<Admin>("Admin");

        modelBuilder.Entity<Matricula>()
            .HasOne(m => m.Turma)
            .WithMany(t => t.Matriculas)
            .HasForeignKey(m => m.TurmaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Matricula>()
            .HasOne(m => m.Aluno)
            .WithMany(a => a.Matriculas)
            .HasForeignKey(m => m.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Curso>()
            .HasOne(c => c.Coordenador)
            .WithMany()
            .HasForeignKey(c => c.CoordenadorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Curso>()
            .HasOne(c => c.Criador)
            .WithMany()
            .HasForeignKey(c => c.CriadoPor)
            .OnDelete(DeleteBehavior.Restrict);
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Turma>()
            .HasIndex(t => new { t.NomeTurma, t.CursoId })
            .IsUnique();
    }
}
