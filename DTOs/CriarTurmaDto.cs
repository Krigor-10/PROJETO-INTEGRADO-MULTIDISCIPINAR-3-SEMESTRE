using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.DTOs;

public class CriarTurmaDto
{
    [Required(ErrorMessage = "O nome da turma é obrigatório.")]
    [StringLength(120)]
    public string NomeTurma { get; set; } = string.Empty;

    [Required(ErrorMessage = "O curso é obrigatório.")]
    public int CursoId { get; set; }

    [Required(ErrorMessage = "O professor é obrigatório.")]
    public int ProfessorId { get; set; }
}