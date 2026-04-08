using System;
using System.Collections.Generic;

namespace PlataformaEnsino.API.Models
{
    public class Aluno : Usuario
    {
        public string Matricula { get; set; }
        public string TurmaAtual { get; set; } = "Não atribuída";

        // Lista que o Entity Framework vai usar para as notas
        public List<Matricula> Matriculas { get; set; } = new List<Matricula>();
        public List<string> Feedbacks { get; set; } = new List<string>();

        // 1. Realizar questionários e atividades
        public void RealizarAtividade(string nomeAtividade)
        {
            Console.WriteLine($"[Sistema] Aluno {Nome} iniciou a atividade: '{nomeAtividade}'.");
        }

        // 2. Postar entregas de atividades
        public void PostarEntrega(string nomeAtividade, string nomeArquivo)
        {
            Console.WriteLine($"[Sistema] Aluno {Nome} postou a entrega para '{nomeAtividade}'. Arquivo: {nomeArquivo}");
        }

        // 3. Visualizar notas (ADAPTADO PARA O NOVO MODELO)
        public void VisualizarNotas()
        {
            Console.WriteLine($"\n--- Boletim de {Nome} ---");

            if (Matriculas.Count == 0)
            {
                Console.WriteLine("Nenhuma matrícula ou nota lançada até ao momento.");
            }
            else
            {
                foreach (var m in Matriculas)
                {
                    string nomeDaTurma = m.Turma != null ? m.Turma.NomeTurma : $"Turma ID: {m.TurmaId}";
                    Console.WriteLine($"- Turma: {nomeDaTurma} | Nota Final: {m.NotaFinal:F1} | Status: {m.Status}");
                }
            }
            Console.WriteLine("-------------------------");
        }

        // 4. Visualizar Feedbacks
        public void VisualizarFeedbacks()
        {
            Console.WriteLine($"\n--- Feedbacks Recebidos: {Nome} ---");
            if (Feedbacks.Count == 0) Console.WriteLine("Nenhum feedback recebido.");
            else foreach (var f in Feedbacks) Console.WriteLine($"> {f}");
            Console.WriteLine("-----------------------------------");
        }

        public override string ExibirDados()
        {
            return base.ExibirDados() + $"\n- Perfil: ALUNO\n- Matrícula: {Matricula}\n- Turma: {TurmaAtual}\n";
        }
    }
}