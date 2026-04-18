using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Repositories;

public class UsuarioRepository : GenericRepository<Usuario>, IUsuarioRepository
{
    public UsuarioRepository(PlataformaContext context) : base(context)
    {
    }

    public async Task<Usuario?> ObterPorEmailAsync(string email)
    {
        var emailNormalizado = (email ?? string.Empty).Trim().ToLower();
        return await Context.Usuarios
            .FirstOrDefaultAsync(usuario => usuario.Email.ToLower() == emailNormalizado);
    }

    public async Task<bool> ExisteEmailAsync(string email)
    {
        var emailNormalizado = (email ?? string.Empty).Trim().ToLower();
        return await Context.Usuarios.AnyAsync(usuario => usuario.Email.ToLower() == emailNormalizado);
    }

    public async Task<bool> ExisteCpfAsync(string cpf)
    {
        var cpfNormalizado = new string((cpf ?? string.Empty).Where(char.IsDigit).ToArray());
        return await Context.Usuarios.AnyAsync(usuario => usuario.Cpf == cpfNormalizado);
    }
}
