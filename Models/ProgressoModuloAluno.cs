using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models;

public class ProgressoModuloAluno
{
    public int Id { get; set; }
    public int MatriculaId { get; set; }
    public int ModuloId { get; set; }
    public StatusProgressoAprendizagem StatusProgresso { get; set; } = StatusProgressoAprendizagem.NaoIniciado;
    public decimal PercentualConclusao { get; set; }
    public decimal PesoConcluido { get; set; }
    public decimal PesoTotal { get; set; }
    public int ConteudosConcluidos { get; set; }
    public int TotalConteudos { get; set; }
    public int AvaliacoesConcluidas { get; set; }
    public int TotalAvaliacoes { get; set; }
    public decimal MediaModulo { get; set; }
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    [ValidateNever]
    public Matricula? Matricula { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Modulo? Modulo { get; set; }
}
