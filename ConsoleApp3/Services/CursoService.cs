using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PlataformaEnsino.API.Models;
using PlataformaEnsino.API.Interfaces;

namespace PlataformaEnsino.API.Services
{
    public class CursoService : ICursoService
    {
        // Injeção de Dependência dos Repositórios
        private readonly IGenericRepository<Curso> _cursoRepository;
        private readonly IGenericRepository<Coordenador> _coordenadorRepository;

        public CursoService(
            IGenericRepository<Curso> cursoRepository,
            IGenericRepository<Coordenador> coordenadorRepository)
        {
            _cursoRepository = cursoRepository;
            _coordenadorRepository = coordenadorRepository;
        }

        public async Task<Curso> CriarCursoAsync(Curso novoCurso)
        {
            // Validações de Regra de Negócio
            if (string.IsNullOrWhiteSpace(novoCurso.Titulo))
            {
                throw new ArgumentException("O título do curso é obrigatório.");
            }

            if (novoCurso.Preco < 0)
            {
                throw new ArgumentException("O preço não pode ser negativo.");
            }

            // 1. O repositório prepara os dados na memória
            await _cursoRepository.AdicionarAsync(novoCurso);

            // 2. A LINHA QUE FALTAVA: Confirma a gravação na base de dados!
            await _cursoRepository.SalvarAlteracoesAsync();

            return novoCurso;
        }

        public async Task<Curso> ObterCursoPorIdAsync(int id)
        {
            var curso = await _cursoRepository.ObterPorIdAsync(id);
            if (curso == null)
            {
                throw new Exception("Curso não encontrado.");
            }
            return curso;
        }

        public async Task<IEnumerable<Curso>> ListarTodosCursosAsync()
        {
            return await _cursoRepository.ObterTodosAsync();
        }

        public async Task AdicionarModuloAsync(int cursoId, Modulo novoModulo)
        {
            var curso = await _cursoRepository.ObterPorIdAsync(cursoId);
            if (curso == null)
            {
                throw new Exception("Curso não encontrado para adicionar o módulo.");
            }

            // Chama o método da entidade que ajustámos anteriormente
            curso.AdicionarModulo(novoModulo);

            // Atualiza o curso na base de dados com o novo módulo
            await _cursoRepository.AtualizarAsync(curso);
        }

        public async Task AtribuirCoordenadorAsync(int cursoId, int coordenadorId)
        {
            var curso = await _cursoRepository.ObterPorIdAsync(cursoId);
            var coordenador = await _coordenadorRepository.ObterPorIdAsync(coordenadorId);

            if (curso == null) throw new Exception("Curso não encontrado.");
            if (coordenador == null) throw new Exception("Coordenador não encontrado.");

            curso.AtribuirCoordenador(coordenador);
            await _cursoRepository.AtualizarAsync(curso);
        }
    }
}