using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface ICursoService
{
    Task<Curso> CriarCursoAsync(Curso novoCurso);
    Task<Curso> ObterCursoPorIdAsync(int id);
    Task<IEnumerable<Curso>> ListarTodosCursosAsync();
    Task AdicionarModuloAsync(int cursoId, Modulo novoModulo);
    Task AtribuirCoordenadorAsync(int cursoId, int coordenadorId);
}
