using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PlataformaEnsino.API.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        private readonly PlataformaContext _context;

        public GenericRepository(PlataformaContext context)
        {
            _context = context;
        }

        public async Task<T> ObterPorIdAsync(int id) => await _context.Set<T>().FindAsync(id);

        public async Task<List<T>> ObterTodosAsync() => await _context.Set<T>().ToListAsync();

        public async Task AdicionarAsync(T entidade) => await _context.Set<T>().AddAsync(entidade);

        public async Task AtualizarAsync(T entidade)
        {
            _context.Set<T>().Update(entidade);
            await Task.CompletedTask;
        }

        public async Task DeletarAsync(T entidade)
        {
            _context.Set<T>().Remove(entidade);
            await Task.CompletedTask;
        }

        public async Task<bool> SalvarAlteracoesAsync() => (await _context.SaveChangesAsync()) > 0;
    }
}