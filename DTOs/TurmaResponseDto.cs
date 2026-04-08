namespace PlataformaEnsino.API.DTOs;

public class TurmaResponseDto
{
    public int Id { get; set; }
    public string NomeTurma { get; set; } = string.Empty;
    public DateTime DataCriacao { get; set; }
    public int CursoId { get; set; }
    public int ProfessorId { get; set; }
}