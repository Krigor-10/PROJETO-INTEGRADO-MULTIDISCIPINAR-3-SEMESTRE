using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface ITurmaService
{
    Task<Turma> CriarTurmaAsync(Turma turma);
    Task<Turma> ObterTurmaPorIdAsync(int id);
    Task<IEnumerable<Turma>> ListarTurmasAsync();
    Task<IEnumerable<Turma>> ListarTurmasPorProfessorAsync(int professorId);
}
