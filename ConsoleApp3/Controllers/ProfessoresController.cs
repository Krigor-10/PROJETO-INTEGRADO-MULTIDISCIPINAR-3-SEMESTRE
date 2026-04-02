using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Models;
using PlataformaEnsino.API.Data; // O namespace correto onde está o seu contexto

namespace PlataformaEnsino.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfessoresController : ControllerBase
    {
        // 1. Alteramos o nome aqui para PlataformaContext
        private readonly PlataformaContext _context;

        // 2. Alteramos o nome aqui no construtor também
        public ProfessoresController(PlataformaContext context)
        {
            _context = context;
        }

        // GET: api/Professores (Busca todos os professores para a tabela)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Professor>>> GetProfessores()
        {
            return await _context.Professores.ToListAsync();
        }

        // POST: api/Professores (Cadastra um novo professor)
        [HttpPost]
        public async Task<ActionResult<Professor>> PostProfessor(Professor professor)
        {
            _context.Professores.Add(professor);
            await _context.SaveChangesAsync();

            return Ok(professor);
        }
    }
}