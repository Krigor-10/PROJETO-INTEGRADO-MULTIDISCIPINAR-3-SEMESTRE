using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface IModuloService
{
    Task<Modulo> CriarModuloAsync(Modulo modulo);
    Task<Modulo> ObterModuloPorIdAsync(int id);
    Task<IEnumerable<Modulo>> ListarModulosAsync();
    Task<IEnumerable<Modulo>> ListarModulosPorProfessorAsync(int professorId);
    Task<IEnumerable<Modulo>> ListarModulosPorCursoAsync(int cursoId);
    Task<Modulo> AtualizarModuloAsync(int id, string titulo);
    Task ExcluirModuloAsync(int id);
}
