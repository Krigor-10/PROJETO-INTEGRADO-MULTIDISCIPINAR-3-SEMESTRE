using System.Collections.Generic;
using System.Threading.Tasks;
using PlataformaEnsino.API.Models;

namespace PlataformaEnsino.API.Interfaces
{
    public interface ITurmaService
    {
        Task<Turma> CriarTurmaAsync(Turma turma);
        Task<Turma> ObterTurmaPorIdAsync(int id);
    }
}