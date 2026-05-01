using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.DTOs;

public class CriarTurmaDto
{
    [StringLength(120)]
    public string? NomeTurma { get; set; }

    [Required(ErrorMessage = "O curso é obrigatório.")]
    public int CursoId { get; set; }

    [Required(ErrorMessage = "O professor é obrigatório.")]
    public int ProfessorId { get; set; }
}
