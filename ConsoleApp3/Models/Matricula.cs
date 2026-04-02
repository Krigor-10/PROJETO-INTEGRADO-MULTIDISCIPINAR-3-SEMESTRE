using System;

namespace PlataformaEnsino.API.Models
{
    public class Matricula
    {
        public int Id { get; set; }
        public DateTime DataSolicitacao { get; set; } = DateTime.Now;
        public decimal NotaFinal { get; set; }
        public StatusMatricula Status { get; set; } = StatusMatricula.Pendente;

        // Chaves Estrangeiras e Navegação
        public int AlunoId { get; set; }
        public Aluno Aluno { get; set; }

        public int TurmaId { get; set; }
        public Turma Turma { get; set; }

        // --- MÉTODOS ---
        public void Aprovar()
        {
            Status = StatusMatricula.Aprovada;
            Console.WriteLine($"[Sistema] Matrícula ID {Id} alterada para APROVADA.");
        }

        public void Rejeitar()
        {
            Status = StatusMatricula.Rejeitada;
            Console.WriteLine($"[Sistema] Matrícula ID {Id} alterada para REJEITADA.");
        }

        public void Cancelar()
        {
            Status = StatusMatricula.Cancelada;
            Console.WriteLine($"[Sistema] Matrícula ID {Id} alterada para CANCELADA.");
        }

        public void LancarNotaFinal(decimal nota)
        {
            if (Status == StatusMatricula.Aprovada)
            {
                NotaFinal = nota;
                Console.WriteLine($"[Sistema] Nota final {nota:F1} lançada para a matrícula ID {Id}.");
            }
            else
            {
                Console.WriteLine($"[Sistema] Falha ao lançar nota. A matrícula ID {Id} não está aprovada.");
            }
        }
    }
}