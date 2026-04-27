using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Common;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;
using PlataformaEnsino.API.DTOs;


namespace PlataformaEnsino.API.Services;

public class MatriculaService : IMatriculaService
{
    private readonly PlataformaContext _context;
    private readonly IMatriculaRepository _matriculaRepository;
    private readonly IGenericRepository<Aluno> _alunoRepository;
    private readonly IGenericRepository<Turma> _turmaRepository;

    public MatriculaService(
        IMatriculaRepository matriculaRepository,
        IGenericRepository<Aluno> alunoRepository,
        IGenericRepository<Turma> turmaRepository,
        PlataformaContext context)
    {
        _context = context;
        _matriculaRepository = matriculaRepository;
        _alunoRepository = alunoRepository;
        _turmaRepository = turmaRepository;
    }

    public async Task<Matricula> MatricularAlunoAsync(int alunoId, int turmaId)
    {
        var aluno = await _alunoRepository.ObterPorIdAsync(alunoId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");

        var turma = await _turmaRepository.ObterPorIdAsync(turmaId)
            ?? throw new KeyNotFoundException("Turma não encontrada.");

        if (await _matriculaRepository.ExisteMatriculaAsync(alunoId, turmaId))
        {
            throw new InvalidOperationException("O aluno já está matriculado nesta turma.");
        }

        var novaMatricula = new Matricula
        {
            AlunoId = alunoId,
            CursoId = turma.CursoId,
            Aluno = aluno,
            Turma = turma
        };
        novaMatricula.CodigoRegistro = await GerarCodigoMatriculaAsync();
        novaMatricula.VincularTurma(turmaId);
        novaMatricula.RegistrarSolicitacao(DateTime.UtcNow);

        await _matriculaRepository.AdicionarAsync(novaMatricula);
        await _matriculaRepository.SalvarAlteracoesAsync();

        return await _matriculaRepository.ObterMatriculaCompletaAsync(novaMatricula.Id) ?? novaMatricula;
    }

    public async Task<Matricula> ObterMatriculaPorIdAsync(int id)
    {
        return await _matriculaRepository.ObterMatriculaCompletaAsync(id)
            ?? throw new KeyNotFoundException("Matrícula não encontrada.");
    }

    public async Task<IEnumerable<Matricula>> ListarMatriculasPorAlunoAsync(int alunoId)
    {
        _ = await _alunoRepository.ObterPorIdAsync(alunoId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");

        return await _matriculaRepository.ObterMatriculasPorAlunoAsync(alunoId);
    }

    public async Task<IEnumerable<MatriculaPendenteDto>> ListarMatriculasPendentesAsync()
    {
        var matriculas = await _matriculaRepository.ObterMatriculasPendentesAsync();

        return matriculas.Select(m => new MatriculaPendenteDto
        {
            Id = m.Id,
            CodigoRegistro = m.CodigoRegistro,
            NomeAluno = m.Aluno?.Nome ?? string.Empty,
            CpfMascarado = MascararCpf(m.Aluno?.Cpf ?? string.Empty),
            NomeTurma = m.Turma?.NomeTurma ?? string.Empty,
            CursoId = m.CursoId,
            DataSolicitacao = m.DataSolicitacao
        });
    }

    public async Task<IEnumerable<Matricula>> ListarMatriculasAsync()
    {
        return await _matriculaRepository.ObterTodosAsync();
    }

    public async Task AprovarMatriculaAsync(int matriculaId, int turmaId)
    {
        var matricula = await _matriculaRepository.ObterPorIdAsync(matriculaId)
            ?? throw new KeyNotFoundException("Matrícula não encontrada.");

        var turma = await _turmaRepository.ObterPorIdAsync(turmaId)
            ?? throw new KeyNotFoundException("Turma não encontrada.");

        if (matricula.CursoId != turma.CursoId)
        {
            throw new InvalidOperationException("A turma selecionada nao pertence ao curso solicitado pelo aluno.");
        }

        var aluno = await _alunoRepository.ObterPorIdAsync(matricula.AlunoId)
            ?? throw new KeyNotFoundException("Aluno não encontrado.");

        if (string.IsNullOrWhiteSpace(matricula.CodigoRegistro))
        {
            matricula.CodigoRegistro = await GerarCodigoMatriculaAsync();
        }

        matricula.AprovarComTurma(turmaId, matricula.CursoId);
        aluno.Matricula = matricula.CodigoRegistro;
        aluno.TurmaAtual = turma.NomeTurma;

        _matriculaRepository.Atualizar(matricula);
        await _matriculaRepository.SalvarAlteracoesAsync();
    }

    public async Task RejeitarMatriculaAsync(int matriculaId)
    {
        var matricula = await _matriculaRepository.ObterPorIdAsync(matriculaId)
            ?? throw new KeyNotFoundException("Matrícula não encontrada.");

        matricula.Rejeitar();

        _matriculaRepository.Atualizar(matricula);
        await _matriculaRepository.SalvarAlteracoesAsync();
    }
    private static string MascararCpf(string cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf))
            return string.Empty;

        var numeros = new string(cpf.Where(char.IsDigit).ToArray());

        if (numeros.Length != 11)
            return cpf;

        return $"***.***.***-{numeros[^2]}{numeros[^1]}";
    }

    private async Task<string> GerarCodigoMatriculaAsync()
    {
        for (var tentativa = 0; tentativa < 10; tentativa++)
        {
            var codigo = CodigoRegistroGenerator.GerarMatricula();

            if (!await _context.Matriculas.AnyAsync(matricula => matricula.CodigoRegistro == codigo))
            {
                return codigo;
            }
        }

        throw new InvalidOperationException("Nao foi possivel gerar um codigo de registro unico para a matricula.");
    }
}
