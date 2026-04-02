using System;

namespace PlataformaEnsino.API.Models
{
    public class Coordenador : Usuario
    {
        public string CursoResponsavel { get; set; }

        // ==========================================
        // 1. GESTÃO DE UTILIZADORES (Alunos e Professores)
        // ==========================================

        public void CadastrarUsuario(Usuario novoUsuario)
        {
            Console.WriteLine($"[Sistema] Coordenador {Nome} registou o utilizador: {novoUsuario.Nome}.");
        }

        public void AvaliarMatricula(string nomeAluno, bool aprovado)
        {
            string status = aprovado ? "APROVADA" : "REJEITADA";
            Console.WriteLine($"[Sistema] A matrícula do aluno {nomeAluno} foi {status} pelo coordenador {Nome}.");
        }

        public void AtribuirTurmaProfessor(Professor professor, string turma)
        {
            // Adiciona a turma à lista do professor
            professor.TurmasAtribuidas.Add(turma);
            Console.WriteLine($"[Sistema] Coordenador {Nome} atribuiu a turma '{turma}' ao professor {professor.Nome}.");
        }

        public void AtribuirAlunoTurma(Aluno aluno, string turma)
        {
            // Altera a propriedade do aluno
            aluno.TurmaAtual = turma;
            Console.WriteLine($"[Sistema] Coordenador {Nome} alocou o aluno {aluno.Nome} na turma '{turma}'.");
        }

        public void AplicarAviso(Aluno alunoDestino, string mensagem)
        {
            string feedbackFormatado = $"[Coordenação - {Nome}] informa: {mensagem}";
            alunoDestino.Feedbacks.Add(feedbackFormatado);
            Console.WriteLine($"[Sistema] Feedback institucional enviado para o aluno {alunoDestino.Nome}.");
        }

        // ==========================================
        // 3. RELATÓRIOS
        // ==========================================

        public void GerarRelatorioAluno(Aluno aluno)
        {
            Console.WriteLine($"\n==========================================");
            Console.WriteLine($" RELATÓRIO DE DESEMPENHO INDIVIDUAL");
            Console.WriteLine($"==========================================");
            Console.WriteLine($"Aluno: {aluno.Nome} | Matrícula: {aluno.Matricula}");
            Console.WriteLine($"Turma: {aluno.TurmaAtual} | Curso: {CursoResponsavel}");

            // Reutiliza o método que já existe no Aluno para mostrar as notas
            aluno.VisualizarNotas();
            Console.WriteLine($"==========================================\n");
        }

        // ==========================================
        // POLIMORFISMO
        // ==========================================
        public override string ExibirDados()
        {
            string dadosBase = base.ExibirDados();
            return dadosBase + $"\n- Perfil: COORDENADOR\n- Curso Responsável: {CursoResponsavel}\n";
        }
    }
}