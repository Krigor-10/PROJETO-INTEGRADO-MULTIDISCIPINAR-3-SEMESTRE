using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models;

public class Curso
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Titulo { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Descricao { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Preco { get; set; }

    public int? CoordenadorId { get; set; }
    public int CriadoPor { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Coordenador? Coordenador { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Admin? Criador { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public List<Modulo> Modulos { get; set; } = new();

    [JsonIgnore]
    [ValidateNever]
    public List<Turma> Turmas { get; set; } = new();

    public void AtribuirCoordenador(Coordenador coordenador)
    {
        ArgumentNullException.ThrowIfNull(coordenador);
        CoordenadorId = coordenador.Id;
        Coordenador = coordenador;
    }

    public void AdicionarModulo(Modulo modulo)
    {
        ArgumentNullException.ThrowIfNull(modulo);
        Modulos.Add(modulo);
    }
}
