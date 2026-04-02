using System.Collections.Generic;
using System.Threading.Tasks;

namespace PlataformaEnsino.API.Interfaces
{
    // O 'T' representa qualquer uma das suas classes (Aluno, Curso, etc.)
    public interface IGenericRepository<T> where T : class
    {
        Task<T> ObterPorIdAsync(int id);
        Task<List<T>> ObterTodosAsync();
        Task AdicionarAsync(T entidade);
        Task AtualizarAsync(T entidade);
        Task DeletarAsync(T entidade);
        Task<bool> SalvarAlteracoesAsync();
    }
}