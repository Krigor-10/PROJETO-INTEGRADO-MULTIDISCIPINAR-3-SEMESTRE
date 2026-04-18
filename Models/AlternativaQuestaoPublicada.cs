using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models;

public class AlternativaQuestaoPublicada
{
    public int Id { get; set; }
    public int QuestaoPublicadaId { get; set; }

    [Required]
    [StringLength(1)]
    public string Letra { get; set; } = string.Empty;

    public string Texto { get; set; } = string.Empty;
    public bool EhCorreta { get; set; }
    public string JustificativaSnapshot { get; set; } = string.Empty;
    public int Ordem { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public QuestaoPublicada? QuestaoPublicada { get; set; }
}
