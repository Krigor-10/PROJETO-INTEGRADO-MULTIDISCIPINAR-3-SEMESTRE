using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models;

public class ProgressoCursoAluno
{
    public int Id { get; set; }
    public int MatriculaId { get; set; }
    public int CursoId { get; set; }
    public StatusProgressoAprendizagem StatusProgresso { get; set; } = StatusProgressoAprendizagem.NaoIniciado;
    public decimal PercentualConclusao { get; set; }
    public decimal PesoConcluido { get; set; }
    public decimal PesoTotal { get; set; }
    public int ModulosConcluidos { get; set; }
    public int TotalModulos { get; set; }
    public decimal MediaCurso { get; set; }
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    [ValidateNever]
    public Matricula? Matricula { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Curso? Curso { get; set; }
}
