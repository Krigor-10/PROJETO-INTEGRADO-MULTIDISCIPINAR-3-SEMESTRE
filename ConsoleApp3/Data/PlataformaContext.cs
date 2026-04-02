using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Models;
using System.Reflection.Emit;

namespace PlataformaEnsino.API.Data
{
    public class PlataformaContext : DbContext
    {
        // ==================================================
        // 1. As suas "Tabelas" no Banco de Dados (DbSets)
        // ==================================================

        // Pessoas (Herança TPH)
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Aluno> Alunos { get; set; }
        public DbSet<Professor> Professores { get; set; }
        public DbSet<Coordenador> Coordenadores { get; set; }
        public DbSet<Admin> Admins { get; set; }

        // Estrutura Acadêmica
        public DbSet<Curso> Cursos { get; set; }
        public DbSet<Modulo> Modulos { get; set; }
        public DbSet<Turma> Turmas { get; set; }
        public DbSet<Matricula> Matriculas { get; set; }

        // ==================================================
        // 2. Configuração de Conexão com o SQL Server
        // ==================================================
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                // String de conexão padrão para o LocalDB do Visual Studio.
                // Se usar o SQL Server Management Studio (SSMS), mude o 'Server' para o nome da sua instância.
                optionsBuilder.UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=PlataformaEnsinoDB;Trusted_Connection=True;");
            }
        }

        // ==================================================
        // 3. Configurações de Relacionamento (Fluent API)
        // ==================================================
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // A. Configurando a Herança (Table Per Hierarchy - TPH)
            // O EF cria apenas uma tabela 'Usuarios' com uma coluna especial 'TipoUsuario'
            modelBuilder.Entity<Usuario>()
                .HasDiscriminator<string>("TipoUsuario")
                .HasValue<Aluno>("Aluno")
                .HasValue<Professor>("Professor")
                .HasValue<Coordenador>("Coordenador")
                .HasValue<Admin>("Admin");

            // B. Prevenindo erro de "Multiple Cascade Paths" no SQL Server
            // Se eu apagar uma Turma, não quero apagar o Aluno inteiro do sistema, 
            // apenas restringimos a exclusão ou apagamos a matrícula.
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

            // C. Prevenindo múltiplos caminhos de cascata no Curso
            // Evita o erro 1785 ao ter duas chaves estrangeiras apontando para Usuarios
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


        }
    }
}