using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.DTOs;

public class CriarAlternativaAvaliacaoDto
{
    [Required]
    [StringLength(1)]
    public string Letra { get; set; } = string.Empty;

    [Required]
    public string Texto { get; set; } = string.Empty;

    public bool EhCorreta { get; set; }
}
