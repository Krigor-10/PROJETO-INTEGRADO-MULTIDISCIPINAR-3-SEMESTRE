using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models;

public class ProgressoConteudoAluno
{
    public int Id { get; set; }
    public int MatriculaId { get; set; }
    public int ConteudoDidaticoId { get; set; }
    public int ModuloId { get; set; }
    public StatusProgressoAprendizagem StatusProgresso { get; set; } = StatusProgressoAprendizagem.NaoIniciado;
    public decimal PercentualConclusao { get; set; }
    public DateTime? PrimeiroAcessoEm { get; set; }
    public DateTime? UltimoAcessoEm { get; set; }
    public DateTime? ConcluidoEm { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Matricula? Matricula { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public ConteudoDidatico? ConteudoDidatico { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Modulo? Modulo { get; set; }
}
