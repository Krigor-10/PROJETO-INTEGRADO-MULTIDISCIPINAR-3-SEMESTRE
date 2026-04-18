using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface IUsuarioRepository : IGenericRepository<Usuario>
{
    Task<Usuario?> ObterPorEmailAsync(string email);
    Task<bool> ExisteEmailAsync(string email);
    Task<bool> ExisteCpfAsync(string cpf);
}
