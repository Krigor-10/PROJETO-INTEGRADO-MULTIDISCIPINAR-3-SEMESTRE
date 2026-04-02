using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PlataformaEnsino.API.Repositories
{
    public class MatriculaRepository : GenericRepository<Matricula>, IMatriculaRepository
    {
        private readonly PlataformaContext _context;

        public MatriculaRepository(PlataformaContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Matricula> ObterMatriculaCompleta(int id)
        {
            return await _context.Matriculas
                .Include(m => m.Aluno) // JOIN com Alunos
                .Include(m => m.Turma) // JOIN com Turmas
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<List<Matricula>> ObterMatriculasPorAluno(int alunoId)
        {
            return await _context.Matriculas
                .Include(m => m.Turma)
                .Where(m => m.AlunoId == alunoId)
                .ToListAsync();
        }
    }
}