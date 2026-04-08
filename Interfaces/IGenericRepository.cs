namespace PlataformaEnsino.API.Interfaces;

public interface IGenericRepository<T> where T : class
{
    Task<T?> ObterPorIdAsync(int id);
    Task<List<T>> ObterTodosAsync();
    Task<T> AdicionarAsync(T entidade);
    void Atualizar(T entidade);
    void Deletar(T entidade);
    Task<bool> SalvarAlteracoesAsync();
}
