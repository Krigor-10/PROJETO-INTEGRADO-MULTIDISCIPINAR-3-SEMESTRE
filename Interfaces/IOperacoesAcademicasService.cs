using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface IOperacoesAcademicasService
{
    string RegistrarAtividadeAluno(Aluno aluno, string nomeAtividade);
    string RegistrarEntregaAluno(Aluno aluno, string nomeAtividade, string nomeArquivo);
    string GerarBoletimAluno(Aluno aluno);
    string ListarFeedbacksAluno(Aluno aluno);
    void AtribuirNota(Professor professor, Matricula matricula, decimal nota);
    void ExcluirNota(Professor professor, Matricula matricula);
    string RegistrarMaterialProfessor(Professor professor, string tituloMaterial, string turma);
    string GerarDesempenhoAlunoProfessor(Professor professor, Aluno aluno);
    void AplicarFeedbackProfessor(Professor professor, Aluno alunoDestino, string mensagem);
    string ListarFeedbacksProfessor(Professor professor);
    string RegistrarCadastroUsuario(Usuario responsavel, Usuario novoUsuario);
    string AlterarStatusUsuario(Admin admin, Usuario usuario, bool estadoAtivo);
    string AvaliarMatricula(Admin admin, Matricula matricula, bool aprovado);
    string AtribuirCursoCoordenador(Admin admin, Coordenador coordenador, string curso);
    string AtribuirTurmaProfessor(Usuario responsavel, Professor professor, string turma);
    string AtribuirAlunoTurma(Coordenador coordenador, Aluno aluno, string turma);
    string AplicarAvisoAdministrativo(Usuario responsavel, Aluno alunoDestino, string origem, string mensagem);
    string GerarRelatorioGeralAdmin(Admin admin);
    string GerarRelatorioAlunoAdmin(Admin admin, Aluno aluno);
    string GerarRelatorioAlunoCoordenador(Coordenador coordenador, Aluno aluno);
    string RegistrarMaterialTurma(Turma turma, string tituloMaterial);
}
