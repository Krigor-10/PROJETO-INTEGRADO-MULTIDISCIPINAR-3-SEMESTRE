using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Services;

public class TurmaService : ITurmaService
{
    private readonly ITurmaRepository _turmaRepository;

    public TurmaService(ITurmaRepository turmaRepository)
    {
        _turmaRepository = turmaRepository;
    }

    public async Task<Turma> CriarTurmaAsync(Turma turma)
    {
        ArgumentNullException.ThrowIfNull(turma);

        if (string.IsNullOrWhiteSpace(turma.NomeTurma))
        {
            throw new ArgumentException("O nome da turma é obrigatório.");
        }

        var existe = await _turmaRepository
            .ExisteTurmaComMesmoNomeAsync(turma.NomeTurma, turma.CursoId);

        if (existe)
        {
            throw new InvalidOperationException(
                $"Já existe uma turma com o nome '{turma.NomeTurma}' para este curso.");
        }

        await _turmaRepository.AdicionarAsync(turma);
        await _turmaRepository.SalvarAlteracoesAsync();

        return turma;
    }

    public async Task<Turma> ObterTurmaPorIdAsync(int id)
    {
        return await _turmaRepository.ObterPorIdAsync(id)
            ?? throw new KeyNotFoundException("Turma não encontrada.");
    }

    public async Task<IEnumerable<Turma>> ListarTurmasAsync()
    {
        return await _turmaRepository.ObterTodosAsync();
    }

}