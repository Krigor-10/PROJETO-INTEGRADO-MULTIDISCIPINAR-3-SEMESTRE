using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.Dtos;

public class MatriculaCriacaoDto
{
    [Required]
    public int AlunoId { get; set; }

    [Required]
    public int TurmaId { get; set; }
}
