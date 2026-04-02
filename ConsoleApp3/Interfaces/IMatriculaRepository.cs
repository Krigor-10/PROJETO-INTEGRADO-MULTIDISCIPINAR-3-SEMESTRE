using System.Collections.Generic;
using System.Threading.Tasks;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces
{
    public interface IMatriculaRepository : IGenericRepository<Matricula>
    {
        // Busca a matrícula trazendo junto os objetos Aluno e Turma (Join no SQL)
        Task<Matricula> ObterMatriculaCompleta(int id);

        // Retorna todas as matrículas de um aluno específico
        Task<List<Matricula>> ObterMatriculasPorAluno(int alunoId);
    }
}