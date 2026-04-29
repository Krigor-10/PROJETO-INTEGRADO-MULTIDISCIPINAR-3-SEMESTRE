using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PlataformaEnsino.API.Models;

public class Turma
{
    public int Id { get; set; }

    [Required]
    [StringLength(16)]
    public string CodigoRegistro { get; set; } = string.Empty;

    [Required]
    [StringLength(120)]
    public string NomeTurma { get; set; } = string.Empty;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    public int CursoId { get; set; }
    public int ProfessorId { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Curso? Curso { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public Professor? ProfessorResponsavel { get; set; }

    [JsonIgnore]
    [ValidateNever]
    public List<Matricula> Matriculas { get; set; } = new();

    [JsonIgnore]
    [ValidateNever]
    public List<ConteudoDidatico> ConteudosDidaticos { get; set; } = new();

    [JsonIgnore]
    [ValidateNever]
    public List<Avaliacao> Avaliacoes { get; set; } = new();

    public void DefinirProfessor(Professor professor)
    {
        ArgumentNullException.ThrowIfNull(professor);
        ProfessorResponsavel = professor;
        ProfessorId = professor.Id;
    }
}
