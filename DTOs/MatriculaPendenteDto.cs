namespace PlataformaEnsino.API.DTOs;

public class MatriculaPendenteDto
{
    public int Id { get; set; }
    public string NomeAluno { get; set; } = string.Empty;
    public string CpfMascarado { get; set; } = string.Empty;
    public string NomeTurma { get; set; } = string.Empty;
    public int CursoId { get; set; }
    public DateTime DataSolicitacao { get; set; }
}