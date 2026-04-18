using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.DTOs;

public class AtualizarModuloDto
{
    [Required(ErrorMessage = "O titulo do modulo e obrigatorio.")]
    [StringLength(150)]
    public string Titulo { get; set; } = string.Empty;
}
