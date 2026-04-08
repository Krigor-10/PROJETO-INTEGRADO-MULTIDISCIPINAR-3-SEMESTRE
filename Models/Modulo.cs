using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.Models;

public class Modulo
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Titulo { get; set; } = string.Empty;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public int CursoId { get; set; }
    public Curso? Curso { get; set; }

    public void AlterarTitulo(string novoTitulo)
    {
        if (string.IsNullOrWhiteSpace(novoTitulo))
        {
            throw new ArgumentException("O título do módulo é obrigatório.");
        }

        Titulo = novoTitulo;
    }
}
