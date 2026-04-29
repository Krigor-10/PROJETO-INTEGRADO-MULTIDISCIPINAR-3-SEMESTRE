using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models;

public class Professor : Usuario
{
    [StringLength(16)]
    public string CodigoRegistro { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string Especialidade { get; set; } = string.Empty;

    [JsonIgnore]
    [ValidateNever]
    public List<QuestaoBanco> QuestoesBanco { get; set; } = new();

    [JsonIgnore]
    [ValidateNever]
    public List<ConteudoDidatico> ConteudosDidaticos { get; set; } = new();

    [JsonIgnore]
    [ValidateNever]
    public List<Avaliacao> AvaliacoesPublicadas { get; set; } = new();

    [JsonIgnore]
    [ValidateNever]
    public List<LancamentoNotaAluno> LancamentosNota { get; set; } = new();

    public override string ExibirDados()
    {
        return base.ExibirDados() + $"\n- Perfil: PROFESSOR\n- Especialidade: {Especialidade}\n";
    }
}
