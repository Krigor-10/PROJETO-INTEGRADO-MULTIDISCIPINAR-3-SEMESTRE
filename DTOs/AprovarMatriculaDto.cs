using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.DTOs;

public class AprovarMatriculaDto
{
    [Required]
    public int TurmaId { get; set; }
}
