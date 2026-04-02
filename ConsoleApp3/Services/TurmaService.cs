using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PlataformaEnsino.API.Models;
using PlataformaEnsino.API.Interfaces;

namespace PlataformaEnsino.API.Services
{
    public class TurmaService : ITurmaService
    {
        private readonly IGenericRepository<Turma> _turmaRepository;

        public TurmaService(IGenericRepository<Turma> turmaRepository)
        {
            _turmaRepository = turmaRepository;
        }

        public async Task<Turma> CriarTurmaAsync(Turma turma)
        {
            if (turma == null) throw new ArgumentNullException(nameof(turma));

            await _turmaRepository.AdicionarAsync(turma);
            return turma;
        }

        public async Task<Turma> ObterTurmaPorIdAsync(int id)
        {
            var turma = await _turmaRepository.ObterPorIdAsync(id);
            if (turma == null) throw new Exception("Turma não encontrada.");
            return turma;
        }
    }
}