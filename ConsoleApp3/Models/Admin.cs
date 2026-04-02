using System;
using System.Collections.Generic;

namespace PlataformaEnsino.API.Models
{
    public class Admin : Usuario
    {
        // ==========================================
        // 1. GERIR UTILIZADORES (Acesso Total)
        // ==========================================

        public void CadastrarUsuario(Usuario novoUsuario)
        {
            Console.WriteLine($"[Sistema] ADMIN {Nome} registou o utilizador: {novoUsuario.Nome}.");
        }

        public void AlterarStatusUsuario(Usuario usuario, bool estadoAtivo)
        {
            usuario.Ativo = estadoAtivo;
            Console.WriteLine($"[Sistema] ADMIN {Nome} alterou o estado de {usuario.Nome} para {(estadoAtivo ? "Ativo" : "Inativo")}.");
        }

        public void AvaliarMatricula(Matricula matricula, bool aprovado)
        {
            if (aprovado) matricula.Aprovar();
            else matricula.Rejeitar();
        }

        public void AtribuirCursoCoordenador(Coordenador coordenador, string curso)
        {
            coordenador.CursoResponsavel = curso;
            Console.WriteLine($"[Sistema] ADMIN {Nome} atribuiu a coordenação do curso '{curso}' a {coordenador.Nome}.");
        }

        public void AtribuirTurmaProfessor(Professor professor, string turma)
        {
            professor.TurmasAtribuidas.Add(turma);
            Console.WriteLine($"[Sistema] ADMIN {Nome} atribuiu a turma '{turma}' ao professor {professor.Nome}.");
        }

        public void AplicarAviso(Aluno alunoDestino, string mensagem)
        {
            string feedbackFormatado = $"[Administração Geral - {Nome}] informa: {mensagem}";
            alunoDestino.Feedbacks.Add(feedbackFormatado);
            Console.WriteLine($"[Sistema] Aviso da administração enviado para o aluno {alunoDestino.Nome}.");
        }

        // ==========================================
        // 3. RELATÓRIOS
        // ==========================================

        public void GerarRelatorioGeral()
        {
            Console.WriteLine($"\n==========================================");
            Console.WriteLine($" RELATÓRIO GERAL DE DESEMPENHO INSTITUCIONAL");
            Console.WriteLine($"==========================================");
            Console.WriteLine($"[Sistema] A compilar dados e estatísticas de todos os cursos, módulos e turmas...");
        }

        public void GerarRelatorioAluno(Aluno aluno)
        {
            Console.WriteLine($"\n==========================================");
            Console.WriteLine($" RELATÓRIO INDIVIDUAL (VISÃO ADMIN)");
            Console.WriteLine($"==========================================");
            Console.WriteLine($"Aluno: {aluno.Nome} | Matrícula: {aluno.Matricula}");
            aluno.VisualizarNotas();
            Console.WriteLine($"==========================================\n");
        }

        public override string ExibirDados()
        {
            return base.ExibirDados() + $"\n- Perfil: ADMINISTRADOR DO SISTEMA (Acesso Total)\n";
        }
    }
}