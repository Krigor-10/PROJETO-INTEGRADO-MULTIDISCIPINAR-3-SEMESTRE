using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Models;
using PlataformaEnsino.API.Data;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PlataformaEnsino.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AlunosController : ControllerBase
    {
        private readonly PlataformaContext _context;

        public AlunosController(PlataformaContext context)
        {
            _context = context;
        }

        // GET: api/Alunos (Busca todos os alunos para a tabela)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Aluno>>> GetAlunos()
        {
            // O Entity Framework vai buscar apenas quem tem "Aluno" na coluna Discriminator
            return await _context.Alunos.ToListAsync();
        }

        // POST: api/Alunos (Cadastra um novo aluno)
        [HttpPost]
        public async Task<ActionResult<Aluno>> PostAluno(Aluno aluno)
        {
            _context.Alunos.Add(aluno);
            await _context.SaveChangesAsync();

            return Ok(aluno);
        }
    }
}