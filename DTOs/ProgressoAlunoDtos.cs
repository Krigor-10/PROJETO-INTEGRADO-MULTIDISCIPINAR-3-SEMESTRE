using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.DTOs;

public class ProgressoAlunoSnapshotDto
{
    public List<ProgressoConteudoAlunoResponseDto> Conteudos { get; set; } = new();
    public List<ProgressoModuloAlunoResponseDto> Modulos { get; set; } = new();
    public List<ProgressoCursoAlunoResponseDto> Cursos { get; set; } = new();
}

public class ProgressoConteudoAlunoResponseDto
{
    public int Id { get; set; }
    public int MatriculaId { get; set; }
    public int ConteudoDidaticoId { get; set; }
    public int ModuloId { get; set; }
    public StatusProgressoAprendizagem StatusProgresso { get; set; }
    public decimal PercentualConclusao { get; set; }
    public DateTime? PrimeiroAcessoEm { get; set; }
    public DateTime? UltimoAcessoEm { get; set; }
    public DateTime? ConcluidoEm { get; set; }
}

public class ProgressoModuloAlunoResponseDto
{
    public int Id { get; set; }
    public int MatriculaId { get; set; }
    public int ModuloId { get; set; }
    public StatusProgressoAprendizagem StatusProgresso { get; set; }
    public decimal PercentualConclusao { get; set; }
    public decimal PesoConcluido { get; set; }
    public decimal PesoTotal { get; set; }
    public int ConteudosConcluidos { get; set; }
    public int TotalConteudos { get; set; }
    public int AvaliacoesConcluidas { get; set; }
    public int TotalAvaliacoes { get; set; }
    public decimal MediaModulo { get; set; }
    public DateTime AtualizadoEm { get; set; }
}

public class ProgressoCursoAlunoResponseDto
{
    public int Id { get; set; }
    public int MatriculaId { get; set; }
    public int CursoId { get; set; }
    public StatusProgressoAprendizagem StatusProgresso { get; set; }
    public decimal PercentualConclusao { get; set; }
    public decimal PesoConcluido { get; set; }
    public decimal PesoTotal { get; set; }
    public int ModulosConcluidos { get; set; }
    public int TotalModulos { get; set; }
    public decimal MediaCurso { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
