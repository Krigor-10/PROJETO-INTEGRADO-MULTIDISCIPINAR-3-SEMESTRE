using PlataformaEnsino.API.DTOs;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface IConteudoDidaticoService
{
    Task<IEnumerable<ConteudoDidatico>> ListarConteudosPorProfessorAsync(int professorId);
    Task<IEnumerable<ConteudoDidatico>> ListarConteudosPorAlunoAsync(int alunoId);
    Task<ConteudoDidatico> ObterConteudoPorProfessorAsync(int id, int professorId);
    Task<ConteudoDidatico> CriarConteudoAsync(int professorId, CriarConteudoDidaticoDto dto);
    Task<ConteudoDidatico> AtualizarConteudoAsync(int id, int professorId, AtualizarConteudoDidaticoDto dto);
    Task ExcluirConteudoAsync(int id, int professorId);
}
