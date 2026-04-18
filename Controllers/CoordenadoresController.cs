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
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public class CoordenadoresController : ControllerBase
    {
        private readonly PlataformaContext _context;

        public CoordenadoresController(PlataformaContext context)
        {
            _context = context;
        }

        // GET: api/Coordenadores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Coordenador>>> GetCoordenadores()
        {
            // O Entity Framework filtra automaticamente quem tem "Coordenador" no Discriminator
            return await _context.Coordenadores.ToListAsync();
        }

        // POST: api/Coordenadores
        [HttpPost]
        public async Task<ActionResult<Coordenador>> PostCoordenador(Coordenador coordenador)
        {
            _context.Coordenadores.Add(coordenador);
            await _context.SaveChangesAsync();

            return Ok(coordenador);
        }
    }
}
