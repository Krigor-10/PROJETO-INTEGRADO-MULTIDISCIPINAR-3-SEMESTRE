using System.ComponentModel.DataAnnotations;

namespace PlataformaEnsino.API.Models;

public class Professor : Usuario
{
    [Required]
    [StringLength(120)]
    public string Especialidade { get; set; } = string.Empty;

    public List<string> TurmasAtribuidas { get; set; } = new();
    public List<string> Feedbacks { get; set; } = new();

    public void AtribuirNota(Matricula matricula, decimal nota)
    {
        ArgumentNullException.ThrowIfNull(matricula);
        matricula.LancarNotaFinal(nota);
    }

    public void ExcluirNota(Matricula matricula)
    {
        ArgumentNullException.ThrowIfNull(matricula);
        matricula.NotaFinal = 0;
    }

    public void PostarMaterial(string tituloMaterial, string turma)
    {
        Console.WriteLine($"[Sistema] Prof. {Nome} postou o material: '{tituloMaterial}' na turma {turma}.");
    }

    public void VisualizarDesempenhoAluno(Aluno aluno)
    {
        Console.WriteLine($"\n--- Visão do Prof. {Nome} ---");
        Console.WriteLine($"Aluno: {aluno.Nome} | Matrícula: {aluno.Matricula}");

        foreach (var m in aluno.Matriculas)
        {
            Console.WriteLine($"> Turma ID: {m.TurmaId} | Nota Final: {m.NotaFinal} | Status: {m.Status}");
        }
    }

    public void AplicarFeedback(Aluno alunoDestino, string mensagem)
    {
        string feedbackFormatado = $"[Prof. {Nome}] informa: {mensagem}";
        alunoDestino.Feedbacks.Add(feedbackFormatado);
    }

    public void VisualizarFeedbacksCoordenacao()
    {
        Console.WriteLine($"\n--- Feedbacks Recebidos: Prof. {Nome} ---");
        if (Feedbacks.Count == 0) Console.WriteLine("Nenhum feedback.");
        else foreach (var fb in Feedbacks) Console.WriteLine($"> {fb}");
    }

    public override string ExibirDados()
    {
        return base.ExibirDados() + $"\n- Perfil: PROFESSOR\n- Especialidade: {Especialidade}\n";
    }
}
