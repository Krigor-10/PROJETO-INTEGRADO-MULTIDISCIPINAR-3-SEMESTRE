using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface IModuloRepository : IGenericRepository<Modulo>
{
    Task<bool> ExisteModuloComMesmoTituloAsync(string titulo, int cursoId, int? ignorarId = null);
    Task<List<Modulo>> ObterPorCursoAsync(int cursoId);
    Task<List<Modulo>> ObterPorProfessorAsync(int professorId);
    Task<bool> PossuiDependenciasAsync(int moduloId);
}
