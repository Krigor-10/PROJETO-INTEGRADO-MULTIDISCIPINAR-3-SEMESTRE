using PlataformaEnsino.API.DTOs;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface IAvaliacaoService
{
    Task<IEnumerable<Avaliacao>> ListarAvaliacoesPorProfessorAsync(int professorId);
    Task<Avaliacao> ObterAvaliacaoPorProfessorAsync(int id, int professorId);
    Task<Avaliacao> CriarAvaliacaoAsync(int professorId, CriarAvaliacaoDto dto);
    Task<Avaliacao> AtualizarAvaliacaoAsync(int id, int professorId, AtualizarAvaliacaoDto dto);
    Task ExcluirAvaliacaoAsync(int id, int professorId);
    Task<IEnumerable<QuestaoPublicada>> ListarQuestoesAsync(int avaliacaoId, int professorId);
    Task<QuestaoPublicada> AdicionarQuestaoAsync(int avaliacaoId, int professorId, CriarQuestaoAvaliacaoDto dto);
    Task ExcluirQuestaoAsync(int avaliacaoId, int questaoId, int professorId);
}
