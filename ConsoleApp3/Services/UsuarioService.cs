using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PlataformaEnsino.API.Models;
using PlataformaEnsino.API.Interfaces;

namespace PlataformaEnsino.API.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IGenericRepository<Usuario> _usuarioRepository;

        public UsuarioService(IGenericRepository<Usuario> usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        public async Task<Usuario> CriarUsuarioAsync(Usuario usuario)
        {
            if (usuario == null) throw new ArgumentNullException(nameof(usuario));

            await _usuarioRepository.AdicionarAsync(usuario);
            await _usuarioRepository.SalvarAlteracoesAsync(); // Adicionado para salvar no banco
            return usuario;
        }

        public async Task<Usuario> ObterUsuarioPorIdAsync(int id)
        {
            var usuario = await _usuarioRepository.ObterPorIdAsync(id);
            if (usuario == null) throw new Exception("Utilizador não encontrado.");
            return usuario;
        }

        public async Task<IEnumerable<Usuario>> ListarTodosUsuariosAsync()
        {
            return await _usuarioRepository.ObterTodosAsync();
        }

        public async Task EliminarUsuarioAsync(int id)
        {
            var usuario = await _usuarioRepository.ObterPorIdAsync(id);
            if (usuario == null) throw new Exception("Utilizador não encontrado.");

            // Correção: Usando o nome exato da sua interface
            await _usuarioRepository.DeletarAsync(usuario);
            await _usuarioRepository.SalvarAlteracoesAsync(); // Adicionado para confirmar a exclusão
        }
    }
}