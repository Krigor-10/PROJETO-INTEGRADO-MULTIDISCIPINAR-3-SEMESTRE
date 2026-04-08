using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces;

public interface IUsuarioService
{
    Task<Usuario> CriarUsuarioAsync(Usuario usuario);
    Task<Usuario> ObterUsuarioPorIdAsync(int id);
    Task<IEnumerable<Usuario>> ListarTodosUsuariosAsync();
    Task EliminarUsuarioAsync(int id);
}
