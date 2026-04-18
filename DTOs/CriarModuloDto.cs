using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.DTOs;

public class CriarModuloDto
{
    [Required(ErrorMessage = "O titulo do modulo e obrigatorio.")]
    [StringLength(150)]
    public string Titulo { get; set; } = string.Empty;

    [Required(ErrorMessage = "O curso e obrigatorio.")]
    public int CursoId { get; set; }
}
