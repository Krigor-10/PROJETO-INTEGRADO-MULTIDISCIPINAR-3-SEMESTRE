using System;
using System.Collections.Generic;

namespace PlataformaEnsino.API.Models
{
    public class Professor : Usuario
    {
        // Atributo EXCLUSIVO do professor adicionado aqui
        public string Especialidade { get; set; }

        public List<string> TurmasAtribuidas { get; set; } = new List<string>();
        public List<string> Feedbacks { get; set; } = new List<string>();

        // ==========================================
        // 1. GERENCIAR USUÁRIO (ALUNOS) - Notas via Matrícula
        // ==========================================

        public void AtribuirNota(Matricula matricula, decimal nota)
        {
            matricula.LancarNotaFinal(nota);
        }

        public void ExcluirNota(Matricula matricula)
        {
            // No novo modelo, "Excluir" a nota é zerá-la ou resetar o campo na matrícula
            matricula.NotaFinal = 0;
            Console.WriteLine($"[Sistema] Prof. {Nome} resetou a nota da matrícula ID {matricula.Id}.");
        }

        // ==========================================
        // 2. GERENCIAR CURSO E DESEMPENHO
        // ==========================================

        public void PostarMaterial(string tituloMaterial, string turma)
        {
            Console.WriteLine($"[Sistema] Prof. {Nome} postou o material: '{tituloMaterial}' na turma {turma}.");
        }

        public void VisualizarDesempenhoAluno(Aluno aluno)
        {
            Console.WriteLine($"\n--- Visão do Prof. {Nome} ---");
            Console.WriteLine($"Aluno: {aluno.Nome} | Matrícula: {aluno.Matricula}");

            // Verificamos a lista de matrículas do aluno em vez do dicionário
            foreach (var m in aluno.Matriculas)
            {
                Console.WriteLine($"> Turma ID: {m.TurmaId} | Nota Final: {m.NotaFinal} | Status: {m.Status}");
            }
        }

        // ==========================================
        // 3. RELATÓRIOS E FEEDBACKS
        // ==========================================

        public void AplicarFeedback(Aluno alunoDestino, string mensagem)
        {
            string feedbackFormatado = $"[Prof. {Nome}] informa: {mensagem}";
            alunoDestino.Feedbacks.Add(feedbackFormatado);
            Console.WriteLine($"[Sistema] Feedback enviado para {alunoDestino.Nome}.");
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
}