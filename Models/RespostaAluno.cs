using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models;

public class RespostaAluno
{
    public int Id { get; set; }
    public int TentativaAvaliacaoId { get; set; }
    public int QuestaoPublicadaId { get; set; }
    public int? AlternativaQuestaoPublicadaId { get; set; }
    public string RespostaTexto { get; set; } = string.Empty;
    public bool? Correta { get; private set; }
    public decimal PontosObtidos { get; private set; }
    public DateTime RespondidaEm { get; private set; } = DateTime.UtcNow;

    [JsonIgnore]
    [ValidateNever]
    public TentativaAvaliacao? TentativaAvaliacao { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public QuestaoPublicada? QuestaoPublicada { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public AlternativaQuestaoPublicada? AlternativaQuestaoPublicada { get; set; }

    public void RegistrarEnvio(DateTime? respondidaEm = null)
    {
        RespondidaEm = respondidaEm ?? DateTime.UtcNow;
    }

    public void Corrigir(bool? correta, decimal pontosObtidos)
    {
        if (pontosObtidos < 0)
        {
            throw new ArgumentException("Os pontos obtidos nao podem ser negativos.");
        }

        Correta = correta;
        PontosObtidos = pontosObtidos;
    }
}
