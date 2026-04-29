using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Services;

public class OperacoesAcademicasService : IOperacoesAcademicasService
{
    public string RegistrarAtividadeAluno(Aluno aluno, string nomeAtividade)
    {
        ArgumentNullException.ThrowIfNull(aluno);
        return $"[Sistema] Aluno {aluno.Nome} iniciou a atividade: '{nomeAtividade}'.";
    }

    public string RegistrarEntregaAluno(Aluno aluno, string nomeAtividade, string nomeArquivo)
    {
        ArgumentNullException.ThrowIfNull(aluno);
        return $"[Sistema] Aluno {aluno.Nome} postou a entrega para '{nomeAtividade}'. Arquivo: {nomeArquivo}";
    }

    public string GerarBoletimAluno(Aluno aluno)
    {
        ArgumentNullException.ThrowIfNull(aluno);

        var linhas = new List<string>
        {
            $"--- Boletim de {aluno.Nome} ---"
        };

        if (aluno.Matriculas.Count == 0)
        {
            linhas.Add("Nenhuma matricula ou nota lancada ate o momento.");
        }
        else
        {
            foreach (var matricula in aluno.Matriculas)
            {
                var nomeDaTurma = matricula.Turma != null
                    ? matricula.Turma.NomeTurma
                    : $"Turma ID: {matricula.TurmaId}";

                linhas.Add($"- Turma: {nomeDaTurma} | Nota Final: {matricula.NotaFinal:F1} | Status: {matricula.Status}");
            }
        }

        linhas.Add("-------------------------");
        return string.Join(Environment.NewLine, linhas);
    }

    public string ListarFeedbacksAluno(Aluno aluno)
    {
        ArgumentNullException.ThrowIfNull(aluno);

        var linhas = new List<string>
        {
            $"--- Feedbacks Recebidos: {aluno.Nome} ---"
        };

        if (aluno.FeedbacksRecebidos.Count == 0)
        {
            linhas.Add("Nenhum feedback recebido.");
        }
        else
        {
            linhas.AddRange(aluno.FeedbacksRecebidos
                .OrderByDescending(feedback => feedback.CriadoEm)
                .Select(FormatarFeedback));
        }

        linhas.Add("-----------------------------------");
        return string.Join(Environment.NewLine, linhas);
    }

    public void AtribuirNota(Professor professor, Matricula matricula, decimal nota)
    {
        ArgumentNullException.ThrowIfNull(professor);
        ArgumentNullException.ThrowIfNull(matricula);
        matricula.LancarNotaFinal(nota);
    }

    public void ExcluirNota(Professor professor, Matricula matricula)
    {
        ArgumentNullException.ThrowIfNull(professor);
        ArgumentNullException.ThrowIfNull(matricula);
        matricula.ZerarNotaFinal();
    }

    public string RegistrarMaterialProfessor(Professor professor, string tituloMaterial, string turma)
    {
        ArgumentNullException.ThrowIfNull(professor);
        return $"[Sistema] Prof. {professor.Nome} postou o material: '{tituloMaterial}' na turma {turma}.";
    }

    public string GerarDesempenhoAlunoProfessor(Professor professor, Aluno aluno)
    {
        ArgumentNullException.ThrowIfNull(professor);
        ArgumentNullException.ThrowIfNull(aluno);

        var linhas = new List<string>
        {
            $"--- Visao do Prof. {professor.Nome} ---",
            $"Aluno: {aluno.Nome} | Matricula: {aluno.Matricula}"
        };

        linhas.AddRange(aluno.Matriculas.Select(matricula =>
            $"> Turma ID: {matricula.TurmaId} | Nota Final: {matricula.NotaFinal} | Status: {matricula.Status}"));

        return string.Join(Environment.NewLine, linhas);
    }

    public void AplicarFeedbackProfessor(Professor professor, Aluno alunoDestino, string mensagem)
    {
        ArgumentNullException.ThrowIfNull(professor);
        ArgumentNullException.ThrowIfNull(alunoDestino);

        alunoDestino.FeedbacksRecebidos.Add(CriarFeedback(professor, alunoDestino, $"Prof. {professor.Nome}", mensagem));
    }

    public string ListarFeedbacksProfessor(Professor professor)
    {
        ArgumentNullException.ThrowIfNull(professor);

        var linhas = new List<string>
        {
            $"--- Feedbacks Recebidos: Prof. {professor.Nome} ---"
        };

        if (professor.FeedbacksRecebidos.Count == 0)
        {
            linhas.Add("Nenhum feedback.");
        }
        else
        {
            linhas.AddRange(professor.FeedbacksRecebidos
                .OrderByDescending(feedback => feedback.CriadoEm)
                .Select(FormatarFeedback));
        }

        return string.Join(Environment.NewLine, linhas);
    }

    public string RegistrarCadastroUsuario(Usuario responsavel, Usuario novoUsuario)
    {
        ArgumentNullException.ThrowIfNull(responsavel);
        ArgumentNullException.ThrowIfNull(novoUsuario);

        return $"[Sistema] {responsavel.Nome} registrou o usuario: {novoUsuario.Nome}.";
    }

    public string AlterarStatusUsuario(Admin admin, Usuario usuario, bool estadoAtivo)
    {
        ArgumentNullException.ThrowIfNull(admin);
        ArgumentNullException.ThrowIfNull(usuario);

        if (estadoAtivo)
        {
            usuario.Ativar();
        }
        else
        {
            usuario.Desativar();
        }

        var status = estadoAtivo ? "Ativo" : "Inativo";
        return $"[Sistema] ADMIN {admin.Nome} alterou o estado de {usuario.Nome} para {status}.";
    }

    public string AvaliarMatricula(Admin admin, Matricula matricula, bool aprovado)
    {
        ArgumentNullException.ThrowIfNull(admin);
        ArgumentNullException.ThrowIfNull(matricula);

        if (aprovado)
        {
            matricula.Aprovar();
        }
        else
        {
            matricula.Rejeitar();
        }

        var status = aprovado ? "APROVADA" : "REJEITADA";
        return $"[Sistema] Matricula {status} por {admin.Nome}.";
    }

    public string AtribuirCursoCoordenador(Admin admin, Coordenador coordenador, string curso)
    {
        ArgumentNullException.ThrowIfNull(admin);
        ArgumentNullException.ThrowIfNull(coordenador);

        coordenador.CursoResponsavel = curso;
        return $"[Sistema] ADMIN {admin.Nome} atribuiu a coordenacao do curso '{curso}' a {coordenador.Nome}.";
    }

    public string AtribuirTurmaProfessor(Usuario responsavel, Professor professor, string turma)
    {
        ArgumentNullException.ThrowIfNull(responsavel);
        ArgumentNullException.ThrowIfNull(professor);

        return $"[Sistema] {responsavel.Nome} solicitou a atribuicao da turma '{turma}' ao professor {professor.Nome}. Use TurmaService para persistir a relacao oficial.";
    }

    public string AtribuirAlunoTurma(Coordenador coordenador, Aluno aluno, string turma)
    {
        ArgumentNullException.ThrowIfNull(coordenador);
        ArgumentNullException.ThrowIfNull(aluno);

        aluno.TurmaAtual = turma;
        return $"[Sistema] Coordenador {coordenador.Nome} alocou o aluno {aluno.Nome} na turma '{turma}'.";
    }

    public string AplicarAvisoAdministrativo(Usuario responsavel, Aluno alunoDestino, string origem, string mensagem)
    {
        ArgumentNullException.ThrowIfNull(responsavel);
        ArgumentNullException.ThrowIfNull(alunoDestino);

        alunoDestino.FeedbacksRecebidos.Add(CriarFeedback(responsavel, alunoDestino, origem, mensagem));
        return $"[Sistema] Aviso enviado para o aluno {alunoDestino.Nome}.";
    }

    public string GerarRelatorioGeralAdmin(Admin admin)
    {
        ArgumentNullException.ThrowIfNull(admin);

        return string.Join(Environment.NewLine, [
            "==========================================",
            " RELATORIO GERAL DE DESEMPENHO INSTITUCIONAL",
            "==========================================",
            $"[Sistema] ADMIN {admin.Nome} solicitou a compilacao de dados de cursos, modulos e turmas."
        ]);
    }

    public string GerarRelatorioAlunoAdmin(Admin admin, Aluno aluno)
    {
        ArgumentNullException.ThrowIfNull(admin);
        ArgumentNullException.ThrowIfNull(aluno);

        return string.Join(Environment.NewLine, [
            "==========================================",
            " RELATORIO INDIVIDUAL (VISAO ADMIN)",
            "==========================================",
            $"Aluno: {aluno.Nome} | Matricula: {aluno.Matricula}",
            GerarBoletimAluno(aluno),
            "=========================================="
        ]);
    }

    public string GerarRelatorioAlunoCoordenador(Coordenador coordenador, Aluno aluno)
    {
        ArgumentNullException.ThrowIfNull(coordenador);
        ArgumentNullException.ThrowIfNull(aluno);

        return string.Join(Environment.NewLine, [
            "==========================================",
            " RELATORIO DE DESEMPENHO INDIVIDUAL",
            "==========================================",
            $"Aluno: {aluno.Nome} | Matricula: {aluno.Matricula}",
            $"Turma: {aluno.TurmaAtual} | Curso: {coordenador.CursoResponsavel}",
            GerarBoletimAluno(aluno),
            "=========================================="
        ]);
    }

    public string RegistrarMaterialTurma(Turma turma, string tituloMaterial)
    {
        ArgumentNullException.ThrowIfNull(turma);
        return $"[Sistema] Material '{tituloMaterial}' disponibilizado para a turma '{turma.NomeTurma}'.";
    }

    private static FeedbackAcademico CriarFeedback(Usuario autor, Usuario destinatario, string origem, string mensagem)
    {
        var feedback = new FeedbackAcademico
        {
            Autor = autor,
            Destinatario = destinatario,
            AutorId = autor.Id > 0 ? autor.Id : null,
            DestinatarioId = destinatario.Id,
            Origem = origem,
            Mensagem = mensagem
        };

        feedback.RegistrarCriacao();
        return feedback;
    }

    private static string FormatarFeedback(FeedbackAcademico feedback)
    {
        return $"> [{feedback.CriadoEm:dd/MM/yyyy}] {feedback.Origem}: {feedback.Mensagem}";
    }
}
