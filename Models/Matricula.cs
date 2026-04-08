using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.Models;

public class Matricula
{
    public int Id { get; set; }
    public DateTime DataSolicitacao { get; set; } = DateTime.UtcNow;

    [Range(0, 10)]
    public decimal NotaFinal { get; set; }

    public StatusMatricula Status { get; set; } = StatusMatricula.Pendente;

    public int AlunoId { get; set; }
    public Aluno? Aluno { get; set; }

    public int CursoId { get; set; }
    public Curso? Curso { get; set; }

    public int? TurmaId { get; set; }
    public Turma? Turma { get; set; }

    public void Aprovar() => Status = StatusMatricula.Aprovada;
    public void Rejeitar() => Status = StatusMatricula.Rejeitada;
    public void Cancelar() => Status = StatusMatricula.Cancelada;

    public void LancarNotaFinal(decimal nota)
    {
        if (Status != StatusMatricula.Aprovada)
        {
            throw new InvalidOperationException("Só é possível lançar nota final para matrículas aprovadas.");
        }

        if (nota is < 0 or > 10)
        {
            throw new ArgumentException("A nota deve estar entre 0 e 10.");
        }

        NotaFinal = nota;
    }
}