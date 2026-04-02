using PlataformaEnsino.API.Interfaces;
using PlataformaEnsino.API.Models;
using Sistema_Academico_Integrado.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PlataformaEnsino.API.Services
{
    public class MatriculaService : IMatriculaService
    {
        private readonly IMatriculaRepository _matriculaRepository;
        private readonly IGenericRepository<Aluno> _alunoRepository;
        private readonly IGenericRepository<Turma> _turmaRepository;

        public MatriculaService(
            IMatriculaRepository matriculaRepository,
            IGenericRepository<Aluno> alunoRepository,
            IGenericRepository<Turma> turmaRepository)
        {
            _matriculaRepository = matriculaRepository;
            _alunoRepository = alunoRepository;
            _turmaRepository = turmaRepository;
        }

        public async Task<Matricula> MatricularAlunoAsync(int alunoId, int turmaId)
        {
            var aluno = await _alunoRepository.ObterPorIdAsync(alunoId);
            var turma = await _turmaRepository.ObterPorIdAsync(turmaId);

            if (aluno == null) throw new Exception("Aluno não encontrado.");
            if (turma == null) throw new Exception("Turma não encontrada.");

            var novaMatricula = new Matricula
            {
                AlunoId = alunoId,
                TurmaId = turmaId,
                // Assumindo que a entidade tem uma Data de Matrícula
                // DataMatricula = DateTime.Now 
            };

            await _matriculaRepository.AdicionarAsync(novaMatricula);
            return novaMatricula;
        }

        public async Task<Matricula> ObterMatriculaPorIdAsync(int id)
        {
            var matricula = await _matriculaRepository.ObterPorIdAsync(id);
            if (matricula == null) throw new Exception("Matrícula não encontrada.");
            return matricula;
        }

        public async Task<IEnumerable<Matricula>> ListarMatriculasPorAlunoAsync(int alunoId)
        {
            // Requer que o seu repositório tenha um método para buscar por expressão ou listar todos e filtrar
            return await _matriculaRepository.ObterTodosAsync();
        }
    }
}