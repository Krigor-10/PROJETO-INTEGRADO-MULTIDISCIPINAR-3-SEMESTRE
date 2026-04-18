using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Data;
using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Repositories;

public class CursoRepository : GenericRepository<Curso>, ICursoRepository
{
    public CursoRepository(PlataformaContext context) : base(context)
    {
    }

    public async Task<bool> ExistePorIdAsync(int id)
    {
        return await Context.Cursos.AnyAsync(curso => curso.Id == id);
    }

    public async Task<List<Curso>> ListarPorProfessorAsync(int professorId)
    {
        return await Context.Cursos
            .Where(curso => Context.Turmas.Any(turma =>
                turma.ProfessorId == professorId &&
                turma.CursoId == curso.Id))
            .OrderBy(curso => curso.Titulo)
            .ToListAsync();
    }
}
