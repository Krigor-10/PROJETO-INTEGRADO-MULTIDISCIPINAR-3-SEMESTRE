using System.Collections.Generic;
using System.Threading.Tasks;
using PlataformaEnsino.API.Models;

namespace Sistema_Academico_Integrado.Interfaces
{
    public interface IMatriculaService
    {
        Task<Matricula> MatricularAlunoAsync(int alunoId, int turmaId);
        Task<Matricula> ObterMatriculaPorIdAsync(int id);
        Task<IEnumerable<Matricula>> ListarMatriculasPorAlunoAsync(int alunoId);
    }
}