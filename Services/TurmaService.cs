using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Common;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Services;

public class TurmaService : ITurmaService
{
    private readonly PlataformaContext _context;
    private readonly ITurmaRepository _turmaRepository;
    private readonly IGenericRepository<Professor> _professorRepository;

    public TurmaService(
        PlataformaContext context,
        ITurmaRepository turmaRepository,
        IGenericRepository<Professor> professorRepository)
    {
        _context = context;
        _turmaRepository = turmaRepository;
        _professorRepository = professorRepository;
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

        turma.CodigoRegistro = await GerarCodigoTurmaAsync();

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

    public async Task<IEnumerable<Turma>> ListarTurmasPorProfessorAsync(int professorId)
    {
        return await _turmaRepository.ObterPorProfessorAsync(professorId);
    }

    public async Task AtribuirProfessorAsync(int turmaId, int professorId)
    {
        if (professorId <= 0)
        {
            throw new ArgumentException("Selecione um professor valido.");
        }

        var turma = await _turmaRepository.ObterPorIdAsync(turmaId)
            ?? throw new KeyNotFoundException("Turma nao encontrada.");

        var professor = await _professorRepository.ObterPorIdAsync(professorId)
            ?? throw new KeyNotFoundException("Professor nao encontrado.");

        turma.DefinirProfessor(professor);
        _turmaRepository.Atualizar(turma);
        await _turmaRepository.SalvarAlteracoesAsync();
    }

    private async Task<string> GerarCodigoTurmaAsync()
    {
        for (var tentativa = 0; tentativa < 10; tentativa++)
        {
            var codigo = CodigoRegistroGenerator.GerarTurma();

            if (!await _context.Turmas.AnyAsync(turma => turma.CodigoRegistro == codigo))
            {
                return codigo;
            }
        }

        throw new InvalidOperationException("Nao foi possivel gerar um codigo de registro unico para a turma.");
    }
}
