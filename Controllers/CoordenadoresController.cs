using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlataformaEnsino.API.DTOs;
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
        public async Task<ActionResult<IEnumerable<CoordenadorResponseDto>>> GetCoordenadores()
        {
            var coordenadores = await _context.Coordenadores
                .AsNoTracking()
                .OrderBy(coordenador => coordenador.Nome)
                .ToListAsync();

            return Ok(coordenadores.Select(MapResponse));
        }

        // POST: api/Coordenadores
        [HttpPost]
        public async Task<ActionResult<Coordenador>> PostCoordenador(Coordenador coordenador)
        {
            _context.Coordenadores.Add(coordenador);
            await _context.SaveChangesAsync();

            return Ok(coordenador);
        }

        private static CoordenadorResponseDto MapResponse(Coordenador coordenador)
        {
            return new CoordenadorResponseDto
            {
                Id = coordenador.Id,
                Nome = coordenador.Nome,
                Email = coordenador.Email,
                Cpf = coordenador.Cpf,
                Telefone = coordenador.Telefone,
                Cep = coordenador.Cep,
                Rua = coordenador.Rua,
                Numero = coordenador.Numero,
                Bairro = coordenador.Bairro,
                Cidade = coordenador.Cidade,
                Estado = coordenador.Estado,
                TipoUsuario = coordenador.TipoUsuario,
                DataCadastro = coordenador.DataCadastro,
                Ativo = coordenador.Ativo,
                CursoResponsavel = coordenador.CursoResponsavel
            };
        }
    }
}
