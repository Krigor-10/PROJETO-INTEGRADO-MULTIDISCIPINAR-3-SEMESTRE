using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models;

public class TentativaAvaliacao
{
    public int Id { get; set; }
    public int AvaliacaoId { get; set; }
    public int MatriculaId { get; set; }
    public int NumeroTentativa { get; private set; } = 1;
    public StatusTentativaAvaliacao StatusTentativa { get; private set; } = StatusTentativaAvaliacao.EmAndamento;
    public DateTime IniciadaEm { get; private set; } = DateTime.UtcNow;
    public DateTime? EnviadaEm { get; private set; }
    public DateTime? CorrigidaEm { get; private set; }
    public decimal NotaBruta { get; private set; }

    [JsonIgnore]
    [ValidateNever]
    public Avaliacao? Avaliacao { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Matricula? Matricula { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public List<RespostaAluno> Respostas { get; set; } = new();

    public void Iniciar(int numeroTentativa, DateTime? iniciadaEm = null)
    {
        if (numeroTentativa <= 0)
        {
            throw new ArgumentException("O numero da tentativa deve ser maior que zero.");
        }

        NumeroTentativa = numeroTentativa;
        StatusTentativa = StatusTentativaAvaliacao.EmAndamento;
        IniciadaEm = iniciadaEm ?? DateTime.UtcNow;
        EnviadaEm = null;
        CorrigidaEm = null;
        NotaBruta = 0;
    }

    public void MarcarEnvio(DateTime? enviadaEm = null)
    {
        StatusTentativa = StatusTentativaAvaliacao.Enviada;
        EnviadaEm = enviadaEm ?? DateTime.UtcNow;
    }

    public void MarcarCorrecao(decimal notaBruta, DateTime? corrigidaEm = null)
    {
        if (notaBruta < 0)
        {
            throw new ArgumentException("A nota bruta nao pode ser negativa.");
        }

        NotaBruta = notaBruta;
        StatusTentativa = StatusTentativaAvaliacao.Corrigida;
        CorrigidaEm = corrigidaEm ?? DateTime.UtcNow;
    }

    public void Expirar()
    {
        StatusTentativa = StatusTentativaAvaliacao.Expirada;
    }
}
