using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface IConteudoDidaticoRepository : IGenericRepository<ConteudoDidatico>
{
    Task<ConteudoDidatico?> ObterDetalhePorIdAsync(int id);
    Task<List<ConteudoDidatico>> ListarPorProfessorAsync(int professorId);
    Task<List<ConteudoDidatico>> ListarPublicadosPorAlunoAsync(int alunoId);
}
