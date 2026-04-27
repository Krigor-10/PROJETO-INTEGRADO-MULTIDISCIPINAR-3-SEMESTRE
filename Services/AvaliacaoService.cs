using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.DTOs;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Services;

public class AvaliacaoService : IAvaliacaoService
{
    private readonly PlataformaContext _context;

    public AvaliacaoService(PlataformaContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Avaliacao>> ListarAvaliacoesPorProfessorAsync(int professorId)
    {
        await ValidarProfessorAsync(professorId);

        return await _context.Avaliacoes
            .AsNoTracking()
            .Where(avaliacao => avaliacao.ProfessorAutorId == professorId)
            .Include(avaliacao => avaliacao.Turma)
            .Include(avaliacao => avaliacao.Modulo)
                .ThenInclude(modulo => modulo!.Curso)
            .Include(avaliacao => avaliacao.Questoes)
            .OrderBy(avaliacao => avaliacao.Turma!.NomeTurma)
            .ThenBy(avaliacao => avaliacao.Modulo!.Titulo)
            .ThenBy(avaliacao => avaliacao.DataAbertura ?? avaliacao.CriadoEm)
            .ThenBy(avaliacao => avaliacao.Titulo)
            .ToListAsync();
    }

    public async Task<Avaliacao> ObterAvaliacaoPorProfessorAsync(int id, int professorId)
    {
        await ValidarProfessorAsync(professorId);

        var avaliacao = await ObterDetalheAsync(id)
            ?? throw new KeyNotFoundException("Avaliacao nao encontrada.");

        if (avaliacao.ProfessorAutorId != professorId)
        {
            throw new KeyNotFoundException("Avaliacao nao encontrada.");
        }

        return avaliacao;
    }

    public async Task<Avaliacao> CriarAvaliacaoAsync(int professorId, CriarAvaliacaoDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        await ValidarProfessorAsync(professorId);
        var turma = await ValidarTurmaDoProfessorAsync(professorId, dto.TurmaId);
        var modulo = await ValidarModuloAsync(dto.ModuloId);

        ValidarCompatibilidadeTurmaModulo(turma, modulo);

        var avaliacao = new Avaliacao
        {
            TurmaId = turma.Id,
            ModuloId = modulo.Id
        };
        avaliacao.DefinirAutor(professorId);

        AplicarDados(avaliacao, dto);

        await _context.Avaliacoes.AddAsync(avaliacao);
        await _context.SaveChangesAsync();

        return await ObterDetalheAsync(avaliacao.Id) ?? avaliacao;
    }

    public async Task<Avaliacao> AtualizarAvaliacaoAsync(int id, int professorId, AtualizarAvaliacaoDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var avaliacao = await ObterAvaliacaoPorProfessorAsync(id, professorId);
        var turma = await ValidarTurmaDoProfessorAsync(professorId, dto.TurmaId);
        var modulo = await ValidarModuloAsync(dto.ModuloId);

        ValidarCompatibilidadeTurmaModulo(turma, modulo);

        avaliacao.TurmaId = turma.Id;
        avaliacao.ModuloId = modulo.Id;
        AplicarDados(avaliacao, dto);

        _context.Avaliacoes.Update(avaliacao);
        await _context.SaveChangesAsync();

        return await ObterDetalheAsync(id) ?? avaliacao;
    }

    public async Task ExcluirAvaliacaoAsync(int id, int professorId)
    {
        var avaliacao = await ObterAvaliacaoPorProfessorAsync(id, professorId);

        _context.Avaliacoes.Remove(avaliacao);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<QuestaoPublicada>> ListarQuestoesAsync(int avaliacaoId, int professorId)
    {
        _ = await ObterAvaliacaoPorProfessorAsync(avaliacaoId, professorId);

        return await _context.QuestoesPublicadas
            .AsNoTracking()
            .Where(questao => questao.AvaliacaoId == avaliacaoId)
            .Include(questao => questao.Alternativas)
            .OrderBy(questao => questao.Ordem)
            .ToListAsync();
    }

    public async Task<QuestaoPublicada> AdicionarQuestaoAsync(int avaliacaoId, int professorId, CriarQuestaoAvaliacaoDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        _ = await ObterAvaliacaoPorProfessorAsync(avaliacaoId, professorId);
        ValidarDadosQuestao(dto);

        var proximaOrdem = await _context.QuestoesPublicadas
            .Where(questao => questao.AvaliacaoId == avaliacaoId)
            .Select(questao => (int?)questao.Ordem)
            .MaxAsync() ?? 0;

        var questaoBanco = new QuestaoBanco
        {
            ProfessorAutorId = professorId,
            TituloInterno = dto.TituloInterno.Trim(),
            Contexto = (dto.Contexto ?? string.Empty).Trim(),
            Enunciado = dto.Enunciado.Trim(),
            TipoQuestao = dto.TipoQuestao,
            Tema = (dto.Tema ?? string.Empty).Trim(),
            Subtema = (dto.Subtema ?? string.Empty).Trim(),
            Dificuldade = dto.Dificuldade,
            ExplicacaoPosResposta = (dto.ExplicacaoPosResposta ?? string.Empty).Trim(),
            Ativa = true,
            CriadoEm = DateTime.UtcNow
        };

        questaoBanco.Alternativas = MontarAlternativasBanco(dto);
        await _context.QuestoesBanco.AddAsync(questaoBanco);
        await _context.SaveChangesAsync();

        var questaoPublicada = new QuestaoPublicada
        {
            AvaliacaoId = avaliacaoId,
            QuestaoBancoId = questaoBanco.Id,
            Ordem = proximaOrdem + 1,
            ContextoSnapshot = questaoBanco.Contexto,
            EnunciadoSnapshot = questaoBanco.Enunciado,
            TipoQuestao = questaoBanco.TipoQuestao,
            ExplicacaoSnapshot = questaoBanco.ExplicacaoPosResposta,
            Pontos = decimal.Round(dto.Pontos, 2, MidpointRounding.AwayFromZero),
            Alternativas = MontarAlternativasPublicadas(questaoBanco.Alternativas)
        };

        await _context.QuestoesPublicadas.AddAsync(questaoPublicada);
        await _context.SaveChangesAsync();

        return await _context.QuestoesPublicadas
            .AsNoTracking()
            .Include(questao => questao.Alternativas)
            .FirstAsync(questao => questao.Id == questaoPublicada.Id);
    }

    public async Task ExcluirQuestaoAsync(int avaliacaoId, int questaoId, int professorId)
    {
        _ = await ObterAvaliacaoPorProfessorAsync(avaliacaoId, professorId);

        var questao = await _context.QuestoesPublicadas
            .Include(item => item.Alternativas)
            .FirstOrDefaultAsync(item => item.Id == questaoId && item.AvaliacaoId == avaliacaoId)
            ?? throw new KeyNotFoundException("Questao da avaliacao nao encontrada.");

        _context.QuestoesPublicadas.Remove(questao);
        await _context.SaveChangesAsync();
    }

    private async Task<Avaliacao?> ObterDetalheAsync(int id)
    {
        return await _context.Avaliacoes
            .Include(avaliacao => avaliacao.Turma)
            .Include(avaliacao => avaliacao.Modulo)
                .ThenInclude(modulo => modulo!.Curso)
            .Include(avaliacao => avaliacao.Questoes)
            .FirstOrDefaultAsync(avaliacao => avaliacao.Id == id);
    }

    private async Task ValidarProfessorAsync(int professorId)
    {
        var existe = await _context.Professores.AsNoTracking().AnyAsync(professor => professor.Id == professorId);
        if (!existe)
        {
            throw new KeyNotFoundException("Professor nao encontrado.");
        }
    }

    private async Task<Turma> ValidarTurmaDoProfessorAsync(int professorId, int turmaId)
    {
        var turma = await _context.Turmas
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == turmaId)
            ?? throw new KeyNotFoundException("Turma nao encontrada.");

        if (turma.ProfessorId != professorId)
        {
            throw new InvalidOperationException("A turma informada nao esta vinculada ao professor autenticado.");
        }

        return turma;
    }

    private async Task<Modulo> ValidarModuloAsync(int moduloId)
    {
        return await _context.Modulos
            .AsNoTracking()
            .FirstOrDefaultAsync(modulo => modulo.Id == moduloId)
            ?? throw new KeyNotFoundException("Modulo nao encontrado.");
    }

    private static void ValidarCompatibilidadeTurmaModulo(Turma turma, Modulo modulo)
    {
        if (turma.CursoId != modulo.CursoId)
        {
            throw new InvalidOperationException("O modulo selecionado nao pertence ao mesmo curso da turma informada.");
        }
    }

    private static void AplicarDados(Avaliacao avaliacao, CriarAvaliacaoDto dto)
    {
        AplicarDadosBase(
            avaliacao,
            dto.Titulo,
            dto.Descricao,
            dto.TipoAvaliacao,
            dto.StatusPublicacao,
            dto.DataAbertura,
            dto.DataFechamento,
            dto.TentativasPermitidas,
            dto.TempoLimiteMinutos,
            dto.NotaMaxima,
            dto.PesoNota,
            dto.PesoProgresso);
    }

    private static void AplicarDados(Avaliacao avaliacao, AtualizarAvaliacaoDto dto)
    {
        AplicarDadosBase(
            avaliacao,
            dto.Titulo,
            dto.Descricao,
            dto.TipoAvaliacao,
            dto.StatusPublicacao,
            dto.DataAbertura,
            dto.DataFechamento,
            dto.TentativasPermitidas,
            dto.TempoLimiteMinutos,
            dto.NotaMaxima,
            dto.PesoNota,
            dto.PesoProgresso);
    }

    private static void AplicarDadosBase(
        Avaliacao avaliacao,
        string titulo,
        string descricao,
        TipoAvaliacao tipoAvaliacao,
        StatusPublicacao statusPublicacao,
        DateTime? dataAbertura,
        DateTime? dataFechamento,
        int tentativasPermitidas,
        int? tempoLimiteMinutos,
        decimal notaMaxima,
        decimal pesoNota,
        decimal pesoProgresso)
    {
        var tituloNormalizado = (titulo ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(tituloNormalizado))
        {
            throw new ArgumentException("O titulo da avaliacao e obrigatorio.");
        }

        if (dataAbertura.HasValue && dataFechamento.HasValue && dataFechamento.Value <= dataAbertura.Value)
        {
            throw new ArgumentException("A data de fechamento deve ser posterior a data de abertura.");
        }

        if (tempoLimiteMinutos.HasValue && tempoLimiteMinutos.Value <= 0)
        {
            throw new ArgumentException("O tempo limite deve ser maior que zero.");
        }

        if (notaMaxima <= 0)
        {
            throw new ArgumentException("A nota maxima deve ser maior que zero.");
        }

        if (pesoNota <= 0)
        {
            throw new ArgumentException("O peso de nota deve ser maior que zero.");
        }

        if (pesoProgresso <= 0)
        {
            throw new ArgumentException("O peso de progresso deve ser maior que zero.");
        }

        avaliacao.Titulo = tituloNormalizado;
        avaliacao.Descricao = (descricao ?? string.Empty).Trim();
        avaliacao.TipoAvaliacao = tipoAvaliacao;
        avaliacao.DataAbertura = dataAbertura;
        avaliacao.DataFechamento = dataFechamento;
        avaliacao.TempoLimiteMinutos = tempoLimiteMinutos;
        avaliacao.NotaMaxima = decimal.Round(notaMaxima, 2, MidpointRounding.AwayFromZero);
        avaliacao.PesoNota = decimal.Round(pesoNota, 2, MidpointRounding.AwayFromZero);
        avaliacao.PesoProgresso = decimal.Round(pesoProgresso, 2, MidpointRounding.AwayFromZero);
        avaliacao.DefinirTentativasPermitidas(tentativasPermitidas);
        AplicarStatus(avaliacao, statusPublicacao);
    }

    private static void AplicarStatus(Avaliacao avaliacao, StatusPublicacao statusPublicacao)
    {
        var agora = DateTime.UtcNow;

        switch (statusPublicacao)
        {
            case StatusPublicacao.Rascunho:
                avaliacao.VoltarParaRascunho(agora);
                break;
            case StatusPublicacao.Publicado:
                avaliacao.Publicar(agora);
                break;
            case StatusPublicacao.Arquivado:
                avaliacao.Arquivar(agora);
                break;
            default:
                throw new ArgumentException("Status de publicacao invalido.");
        }
    }

    private static void ValidarDadosQuestao(CriarQuestaoAvaliacaoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TituloInterno))
        {
            throw new ArgumentException("Informe um titulo interno para a questao.");
        }

        if (string.IsNullOrWhiteSpace(dto.Enunciado))
        {
            throw new ArgumentException("Informe o enunciado da questao.");
        }

        if (dto.Pontos <= 0)
        {
            throw new ArgumentException("A pontuacao da questao deve ser maior que zero.");
        }

        if (dto.TipoQuestao == TipoQuestao.Discursiva)
        {
            return;
        }

        if (dto.Alternativas.Count < 2)
        {
            throw new ArgumentException("Informe pelo menos duas alternativas.");
        }

        if (dto.Alternativas.Count(alternativa => alternativa.EhCorreta) != 1)
        {
            throw new ArgumentException("Marque exatamente uma alternativa correta.");
        }

        if (dto.Alternativas.Any(alternativa => string.IsNullOrWhiteSpace(alternativa.Letra) || string.IsNullOrWhiteSpace(alternativa.Texto)))
        {
            throw new ArgumentException("Todas as alternativas precisam de letra e texto.");
        }
    }

    private static List<AlternativaQuestaoBanco> MontarAlternativasBanco(CriarQuestaoAvaliacaoDto dto)
    {
        if (dto.TipoQuestao == TipoQuestao.Discursiva)
        {
            return new List<AlternativaQuestaoBanco>();
        }

        return dto.Alternativas
            .Select((alternativa, index) => new AlternativaQuestaoBanco
            {
                Letra = alternativa.Letra.Trim().ToUpperInvariant()[..1],
                Texto = alternativa.Texto.Trim(),
                EhCorreta = alternativa.EhCorreta,
                Justificativa = string.Empty,
                Ordem = index + 1
            })
            .ToList();
    }

    private static List<AlternativaQuestaoPublicada> MontarAlternativasPublicadas(IEnumerable<AlternativaQuestaoBanco> alternativas)
    {
        return alternativas
            .OrderBy(alternativa => alternativa.Ordem)
            .Select(alternativa => new AlternativaQuestaoPublicada
            {
                Letra = alternativa.Letra,
                Texto = alternativa.Texto,
                EhCorreta = alternativa.EhCorreta,
                JustificativaSnapshot = alternativa.Justificativa,
                Ordem = alternativa.Ordem
            })
            .ToList();
    }
}
