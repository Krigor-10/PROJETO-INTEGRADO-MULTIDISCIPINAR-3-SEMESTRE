using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.Models;
using PlataformaEnsino.API.Data;
using System.Threading.Tasks;

namespace PlataformaEnsino.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TurmasController : ControllerBase
    {
        private readonly PlataformaContext _context;

        public TurmasController(PlataformaContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTurmas()
        {
            var turmas = await _context.Turmas.ToListAsync();
            return Ok(turmas);
        }

        [HttpPost]
        public async Task<IActionResult> PostTurma([FromBody] Turma turma)
        {
            try
            {
                _context.Turmas.Add(turma);
                await _context.SaveChangesAsync(); // O salvamento direto no banco
                return Ok(turma);
            }
            catch (System.Exception ex)
            {
                return BadRequest("Erro ao guardar a turma: " + (ex.InnerException?.Message ?? ex.Message));
            }
        }
    }
}