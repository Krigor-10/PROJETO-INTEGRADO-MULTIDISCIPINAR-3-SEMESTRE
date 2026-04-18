using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface ICursoRepository : IGenericRepository<Curso>
{
    Task<bool> ExistePorIdAsync(int id);
    Task<List<Curso>> ListarPorProfessorAsync(int professorId);
}
