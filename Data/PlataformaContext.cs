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
    public DbSet<ConteudoDidatico> ConteudosDidaticos { get; set; }
    public DbSet<QuestaoBanco> QuestoesBanco { get; set; }
    public DbSet<AlternativaQuestaoBanco> AlternativasQuestoesBanco { get; set; }
    public DbSet<AnexoQuestaoBanco> AnexosQuestoesBanco { get; set; }
    public DbSet<Avaliacao> Avaliacoes { get; set; }
    public DbSet<QuestaoPublicada> QuestoesPublicadas { get; set; }
    public DbSet<AlternativaQuestaoPublicada> AlternativasQuestoesPublicadas { get; set; }
    public DbSet<TentativaAvaliacao> TentativasAvaliacao { get; set; }
    public DbSet<RespostaAluno> RespostasAlunos { get; set; }
    public DbSet<LancamentoNotaAluno> LancamentosNotasAlunos { get; set; }
    public DbSet<ProgressoConteudoAluno> ProgressosConteudosAlunos { get; set; }
    public DbSet<ProgressoModuloAluno> ProgressosModulosAlunos { get; set; }
    public DbSet<ProgressoCursoAluno> ProgressosCursosAlunos { get; set; }
    public DbSet<MarcoProgressoAluno> MarcosProgressosAlunos { get; set; }

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

        modelBuilder.Entity<Curso>()
            .Property(c => c.Preco)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Curso>()
            .Property(c => c.CodigoRegistro)
            .HasMaxLength(16)
            .IsRequired();

        modelBuilder.Entity<Curso>()
            .HasIndex(c => c.CodigoRegistro)
            .IsUnique();

        modelBuilder.Entity<Matricula>()
            .Property(m => m.NotaFinal)
            .HasPrecision(4, 2);

        modelBuilder.Entity<Matricula>()
            .Property(m => m.CodigoRegistro)
            .HasMaxLength(16)
            .IsRequired();

        modelBuilder.Entity<Matricula>()
            .HasIndex(m => m.CodigoRegistro)
            .IsUnique();

        modelBuilder.Entity<Turma>()
            .HasIndex(t => new { t.NomeTurma, t.CursoId })
            .IsUnique();

        modelBuilder.Entity<Modulo>()
            .HasIndex(m => new { m.CursoId, m.Titulo })
            .IsUnique();

        modelBuilder.Entity<Modulo>()
            .Property(m => m.CodigoRegistro)
            .HasMaxLength(16)
            .IsRequired();

        modelBuilder.Entity<Modulo>()
            .HasIndex(m => m.CodigoRegistro)
            .IsUnique();

        modelBuilder.Entity<ConteudoDidatico>()
            .HasOne(c => c.ProfessorAutor)
            .WithMany(p => p.ConteudosDidaticos)
            .HasForeignKey(c => c.ProfessorAutorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ConteudoDidatico>()
            .HasOne(c => c.Turma)
            .WithMany(t => t.ConteudosDidaticos)
            .HasForeignKey(c => c.TurmaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ConteudoDidatico>()
            .HasOne(c => c.Modulo)
            .WithMany(m => m.ConteudosDidaticos)
            .HasForeignKey(c => c.ModuloId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ConteudoDidatico>()
            .Property(c => c.CorpoTexto)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<ConteudoDidatico>()
            .Property(c => c.PesoProgresso)
            .HasPrecision(6, 2);

        modelBuilder.Entity<QuestaoBanco>()
            .HasOne(q => q.ProfessorAutor)
            .WithMany(p => p.QuestoesBanco)
            .HasForeignKey(q => q.ProfessorAutorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<QuestaoBanco>()
            .Property(q => q.Contexto)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<QuestaoBanco>()
            .Property(q => q.Enunciado)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<QuestaoBanco>()
            .Property(q => q.ExplicacaoPosResposta)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<AlternativaQuestaoBanco>()
            .HasOne(a => a.QuestaoBanco)
            .WithMany(q => q.Alternativas)
            .HasForeignKey(a => a.QuestaoBancoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AlternativaQuestaoBanco>()
            .HasIndex(a => new { a.QuestaoBancoId, a.Letra })
            .IsUnique();

        modelBuilder.Entity<AlternativaQuestaoBanco>()
            .Property(a => a.Texto)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<AlternativaQuestaoBanco>()
            .Property(a => a.Justificativa)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<AnexoQuestaoBanco>()
            .HasOne(a => a.QuestaoBanco)
            .WithMany(q => q.Anexos)
            .HasForeignKey(a => a.QuestaoBancoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Avaliacao>()
            .HasOne(a => a.ProfessorAutor)
            .WithMany(p => p.AvaliacoesPublicadas)
            .HasForeignKey(a => a.ProfessorAutorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Avaliacao>()
            .HasOne(a => a.Turma)
            .WithMany(t => t.Avaliacoes)
            .HasForeignKey(a => a.TurmaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Avaliacao>()
            .HasOne(a => a.Modulo)
            .WithMany(m => m.Avaliacoes)
            .HasForeignKey(a => a.ModuloId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Avaliacao>()
            .Property(a => a.NotaMaxima)
            .HasPrecision(6, 2);

        modelBuilder.Entity<Avaliacao>()
            .Property(a => a.PesoNota)
            .HasPrecision(6, 2);

        modelBuilder.Entity<Avaliacao>()
            .Property(a => a.PesoProgresso)
            .HasPrecision(6, 2);

        modelBuilder.Entity<QuestaoPublicada>()
            .HasOne(q => q.Avaliacao)
            .WithMany(a => a.Questoes)
            .HasForeignKey(q => q.AvaliacaoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuestaoPublicada>()
            .HasOne(q => q.QuestaoBanco)
            .WithMany(qb => qb.QuestoesPublicadas)
            .HasForeignKey(q => q.QuestaoBancoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<QuestaoPublicada>()
            .HasIndex(q => new { q.AvaliacaoId, q.Ordem })
            .IsUnique();

        modelBuilder.Entity<QuestaoPublicada>()
            .Property(q => q.ContextoSnapshot)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<QuestaoPublicada>()
            .Property(q => q.EnunciadoSnapshot)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<QuestaoPublicada>()
            .Property(q => q.ExplicacaoSnapshot)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<QuestaoPublicada>()
            .Property(q => q.Pontos)
            .HasPrecision(6, 2);

        modelBuilder.Entity<AlternativaQuestaoPublicada>()
            .HasOne(a => a.QuestaoPublicada)
            .WithMany(q => q.Alternativas)
            .HasForeignKey(a => a.QuestaoPublicadaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AlternativaQuestaoPublicada>()
            .HasIndex(a => new { a.QuestaoPublicadaId, a.Letra })
            .IsUnique();

        modelBuilder.Entity<AlternativaQuestaoPublicada>()
            .Property(a => a.Texto)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<AlternativaQuestaoPublicada>()
            .Property(a => a.JustificativaSnapshot)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<TentativaAvaliacao>()
            .HasOne(t => t.Avaliacao)
            .WithMany(a => a.Tentativas)
            .HasForeignKey(t => t.AvaliacaoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TentativaAvaliacao>()
            .HasOne(t => t.Matricula)
            .WithMany(m => m.TentativasAvaliacao)
            .HasForeignKey(t => t.MatriculaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TentativaAvaliacao>()
            .HasIndex(t => new { t.MatriculaId, t.AvaliacaoId, t.NumeroTentativa })
            .IsUnique();

        modelBuilder.Entity<TentativaAvaliacao>()
            .Property(t => t.NotaBruta)
            .HasPrecision(6, 2);

        modelBuilder.Entity<RespostaAluno>()
            .HasOne(r => r.TentativaAvaliacao)
            .WithMany(t => t.Respostas)
            .HasForeignKey(r => r.TentativaAvaliacaoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RespostaAluno>()
            .HasOne(r => r.QuestaoPublicada)
            .WithMany(q => q.Respostas)
            .HasForeignKey(r => r.QuestaoPublicadaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RespostaAluno>()
            .HasOne(r => r.AlternativaQuestaoPublicada)
            .WithMany()
            .HasForeignKey(r => r.AlternativaQuestaoPublicadaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RespostaAluno>()
            .HasIndex(r => new { r.TentativaAvaliacaoId, r.QuestaoPublicadaId })
            .IsUnique();

        modelBuilder.Entity<RespostaAluno>()
            .Property(r => r.RespostaTexto)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<RespostaAluno>()
            .Property(r => r.PontosObtidos)
            .HasPrecision(6, 2);

        modelBuilder.Entity<LancamentoNotaAluno>()
            .HasOne(l => l.Matricula)
            .WithMany(m => m.LancamentosNota)
            .HasForeignKey(l => l.MatriculaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LancamentoNotaAluno>()
            .HasOne(l => l.Avaliacao)
            .WithMany(a => a.LancamentosNota)
            .HasForeignKey(l => l.AvaliacaoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LancamentoNotaAluno>()
            .HasOne(l => l.Modulo)
            .WithMany(m => m.LancamentosNota)
            .HasForeignKey(l => l.ModuloId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LancamentoNotaAluno>()
            .HasOne(l => l.TentativaAvaliacao)
            .WithMany()
            .HasForeignKey(l => l.TentativaAvaliacaoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LancamentoNotaAluno>()
            .HasOne(l => l.ProfessorResponsavel)
            .WithMany(p => p.LancamentosNota)
            .HasForeignKey(l => l.ProfessorResponsavelId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LancamentoNotaAluno>()
            .HasIndex(l => new { l.MatriculaId, l.AvaliacaoId })
            .IsUnique();

        modelBuilder.Entity<LancamentoNotaAluno>()
            .Property(l => l.NotaOficial)
            .HasPrecision(6, 2);

        modelBuilder.Entity<LancamentoNotaAluno>()
            .Property(l => l.PesoNota)
            .HasPrecision(6, 2);

        modelBuilder.Entity<LancamentoNotaAluno>()
            .Property(l => l.FeedbackProfessor)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<ProgressoConteudoAluno>()
            .HasOne(p => p.Matricula)
            .WithMany(m => m.ProgressosConteudo)
            .HasForeignKey(p => p.MatriculaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProgressoConteudoAluno>()
            .HasOne(p => p.ConteudoDidatico)
            .WithMany(c => c.ProgressosAlunos)
            .HasForeignKey(p => p.ConteudoDidaticoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProgressoConteudoAluno>()
            .HasOne(p => p.Modulo)
            .WithMany(m => m.ProgressosConteudo)
            .HasForeignKey(p => p.ModuloId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProgressoConteudoAluno>()
            .HasIndex(p => new { p.MatriculaId, p.ConteudoDidaticoId })
            .IsUnique();

        modelBuilder.Entity<ProgressoConteudoAluno>()
            .Property(p => p.PercentualConclusao)
            .HasPrecision(5, 2);

        modelBuilder.Entity<ProgressoModuloAluno>()
            .HasOne(p => p.Matricula)
            .WithMany(m => m.ProgressosModulo)
            .HasForeignKey(p => p.MatriculaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProgressoModuloAluno>()
            .HasOne(p => p.Modulo)
            .WithMany(m => m.ProgressosAlunos)
            .HasForeignKey(p => p.ModuloId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProgressoModuloAluno>()
            .HasIndex(p => new { p.MatriculaId, p.ModuloId })
            .IsUnique();

        modelBuilder.Entity<ProgressoModuloAluno>()
            .Property(p => p.PercentualConclusao)
            .HasPrecision(5, 2);

        modelBuilder.Entity<ProgressoModuloAluno>()
            .Property(p => p.PesoConcluido)
            .HasPrecision(8, 2);

        modelBuilder.Entity<ProgressoModuloAluno>()
            .Property(p => p.PesoTotal)
            .HasPrecision(8, 2);

        modelBuilder.Entity<ProgressoModuloAluno>()
            .Property(p => p.MediaModulo)
            .HasPrecision(6, 2);

        modelBuilder.Entity<ProgressoCursoAluno>()
            .HasOne(p => p.Matricula)
            .WithMany(m => m.ProgressosCurso)
            .HasForeignKey(p => p.MatriculaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProgressoCursoAluno>()
            .HasOne(p => p.Curso)
            .WithMany(c => c.ProgressosAlunos)
            .HasForeignKey(p => p.CursoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProgressoCursoAluno>()
            .HasIndex(p => new { p.MatriculaId, p.CursoId })
            .IsUnique();

        modelBuilder.Entity<ProgressoCursoAluno>()
            .Property(p => p.PercentualConclusao)
            .HasPrecision(5, 2);

        modelBuilder.Entity<ProgressoCursoAluno>()
            .Property(p => p.PesoConcluido)
            .HasPrecision(8, 2);

        modelBuilder.Entity<ProgressoCursoAluno>()
            .Property(p => p.PesoTotal)
            .HasPrecision(8, 2);

        modelBuilder.Entity<ProgressoCursoAluno>()
            .Property(p => p.MediaCurso)
            .HasPrecision(6, 2);

        modelBuilder.Entity<MarcoProgressoAluno>()
            .HasOne(m => m.Matricula)
            .WithMany(matricula => matricula.MarcosProgresso)
            .HasForeignKey(m => m.MatriculaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MarcoProgressoAluno>()
            .HasOne(m => m.Curso)
            .WithMany(c => c.MarcosProgresso)
            .HasForeignKey(m => m.CursoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MarcoProgressoAluno>()
            .HasOne(m => m.Modulo)
            .WithMany(modulo => modulo.MarcosProgresso)
            .HasForeignKey(m => m.ModuloId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MarcoProgressoAluno>()
            .HasIndex(m => new { m.MatriculaId, m.Escopo, m.CursoId, m.ModuloId, m.PercentualMarco });

        modelBuilder.Entity<MarcoProgressoAluno>()
            .Property(m => m.PercentualMarco)
            .HasPrecision(5, 2);

        modelBuilder.Entity<MarcoProgressoAluno>()
            .Property(m => m.Observacao)
            .HasColumnType("nvarchar(max)");
    }
}
